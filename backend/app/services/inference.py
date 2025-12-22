import pymc as pm
import arviz as az
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # バックエンドモードに設定
import matplotlib.pyplot as plt
import io
import base64
from typing import Dict, Any, Tuple, Optional
from ..models.model import PyMCModel
from ..models.inference import InferenceConfigMCMC, InferenceConfigVI
from ..services.code_generator import CodeGenerator


class InferenceEngine:
    """推論実行エンジン"""

    def __init__(self, model_data: PyMCModel):
        self.model_data = model_data
        self.code_gen = CodeGenerator(model_data)

    def run_mcmc(self, config: InferenceConfigMCMC) -> Tuple[az.InferenceData, pm.Model]:
        """MCMC推論を実行"""
        # PyMCモデルを構築
        pm_model = self.code_gen._build_pymc_model()

        with pm_model:
            # サンプラーの選択
            if config.sampler == "NUTS":
                step = pm.NUTS()
            else:  # Metropolis
                step = pm.Metropolis()

            # サンプリング実行
            # 初期値の問題を回避するため、複数回試行
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    init_method = 'jitter+adapt_diag' if attempt > 0 else 'auto'
                    trace = pm.sample(
                        draws=config.draws,
                        tune=config.tune,
                        chains=config.chains,
                        cores=config.cores,
                        step=step,
                        return_inferencedata=True,
                        progressbar=False,
                        init=init_method
                    )
                    break  # 成功したらループを抜ける
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"Sampling attempt {attempt + 1} failed, retrying with different initialization...")
                    else:
                        print(f"All sampling attempts failed.")
                        raise  # 最後の試行で失敗したら例外を再送出

            # 事後予測サンプリングとlog_likelihood計算を同時に実行
            if self._has_observed_nodes():
                try:
                    pm.sample_posterior_predictive(
                        trace,
                        extend_inferencedata=True,
                        progressbar=False
                    )
                    # log_likelihoodを計算
                    pm.compute_log_likelihood(trace)
                except Exception as e:
                    print(f"Error in posterior predictive sampling or log_likelihood: {e}")
                    import traceback
                    traceback.print_exc()

        return trace, pm_model

    def run_vi(self, config: InferenceConfigVI) -> Tuple[az.InferenceData, pm.Model]:
        """変分推論を実行"""
        # PyMCモデルを構築
        pm_model = self.code_gen._build_pymc_model()

        with pm_model:
            # VI手法の選択
            if config.vi_method == "ADVI":
                approx = pm.fit(
                    n=config.iterations,
                    method="advi",
                    progressbar=False
                )
            else:  # FullRankADVI
                approx = pm.fit(
                    n=config.iterations,
                    method="fullrank_advi",
                    progressbar=False
                )

            # 近似事後分布からサンプリング
            trace = approx.sample(config.draws)

            # InferenceDataに変換
            trace = az.from_pymc3(trace=trace, model=pm_model)

            # 事後予測サンプリングとlog_likelihood計算
            if self._has_observed_nodes():
                try:
                    with pm_model:
                        pm.sample_posterior_predictive(
                            trace,
                            extend_inferencedata=True,
                            progressbar=False
                        )
                        pm.compute_log_likelihood(trace)
                except Exception as e:
                    print(f"VI: Error in posterior predictive sampling or log_likelihood: {e}")
                    import traceback
                    traceback.print_exc()

        return trace, pm_model

    def run_prior_predictive(self, samples: int = 1000) -> Tuple[az.InferenceData, Dict[str, str]]:
        """事前予測チェックを実行"""
        # PyMCモデルを構築
        pm_model = self.code_gen._build_pymc_model()

        with pm_model:
            # 事前予測サンプリング
            prior_predictive = pm.sample_prior_predictive(
                samples=samples,
                return_inferencedata=True
            )

        # プロット生成
        plots = {}

        # InferenceDataの構造を確認
        print(f"InferenceData groups: {list(prior_predictive.groups())}")

        # Prior distributions plot (各パラメータの事前分布)
        try:
            # priorグループが存在する場合
            if hasattr(prior_predictive, 'prior') and prior_predictive.prior:
                var_names = list(prior_predictive.prior.data_vars)
                print(f"Prior variables: {var_names}")

                # 観測変数を除外
                plot_vars = [v for v in var_names if not any(
                    node.observed and node.name == v
                    for node in self.model_data.nodes
                )]

                if plot_vars:
                    fig, axes = plt.subplots(len(plot_vars), 2, figsize=(12, 3*len(plot_vars)))
                    if len(plot_vars) == 1:
                        axes = axes.reshape(1, -1)

                    for idx, var_name in enumerate(plot_vars):
                        data = prior_predictive.prior[var_name].values.flatten()

                        # KDE plot
                        axes[idx, 0].hist(data, bins=50, density=True, alpha=0.7, edgecolor='black')
                        axes[idx, 0].set_xlabel('Value')
                        axes[idx, 0].set_ylabel('Density')
                        axes[idx, 0].set_title(f'{var_name} - Distribution')

                        # Trace plot
                        axes[idx, 1].plot(data[:500], alpha=0.5)  # 最初の500サンプルのみ
                        axes[idx, 1].set_xlabel('Sample')
                        axes[idx, 1].set_ylabel('Value')
                        axes[idx, 1].set_title(f'{var_name} - Samples')

                    plt.suptitle('Prior Distributions', fontsize=16)
                    plt.tight_layout()
                    plots['prior_trace_plot'] = self._fig_to_base64(fig)
                    plt.close(fig)
        except Exception as e:
            print(f"Prior trace plot error: {e}")
            import traceback
            traceback.print_exc()

        # Prior predictive plot (観測変数がある場合のみ)
        try:
            if self._has_observed_nodes() and hasattr(prior_predictive, 'prior'):
                # 事前予測分布のヒストグラム/KDEプロット
                fig, axes = plt.subplots(figsize=(12, 6))

                # priorグループから観測変数を取得してプロット
                observed_vars = [
                    node.name for node in self.model_data.nodes
                    if node.observed and node.name in prior_predictive.prior.data_vars
                ]

                if observed_vars:
                    for var_name in observed_vars:
                        data = prior_predictive.prior[var_name].values.flatten()
                        axes.hist(data, bins=50, alpha=0.6, label=var_name, density=True, edgecolor='black')

                    axes.set_xlabel('Value')
                    axes.set_ylabel('Density')
                    axes.set_title('Prior Predictive Distribution (Observed Variables)')
                    axes.legend()
                    plots['prior_predictive_plot'] = self._fig_to_base64(fig)
                    plt.close(fig)
        except Exception as e:
            print(f"Prior predictive plot error: {e}")
            import traceback
            traceback.print_exc()

        return prior_predictive, plots

    def _has_observed_nodes(self) -> bool:
        """観測ノードが存在するかチェック"""
        return any(node.observed for node in self.model_data.nodes if hasattr(node, 'observed'))

    def generate_plots(
        self,
        trace: az.InferenceData,
        hdi_prob: float = 0.95
    ) -> Dict[str, str]:
        """ArviZプロットを生成してbase64エンコード"""
        plots = {}

        # Trace plot
        try:
            # posteriorグループから変数を取得
            if hasattr(trace, 'posterior') and trace.posterior:
                var_names = list(trace.posterior.data_vars)

                if var_names:
                    # 各変数ごとに2列のサブプロット（分布とトレース）を作成
                    fig, axes = plt.subplots(len(var_names), 2, figsize=(12, 3*len(var_names)))
                    if len(var_names) == 1:
                        axes = axes.reshape(1, -1)

                    for idx, var_name in enumerate(var_names):
                        # posteriorデータを取得（全チェーン、全サンプル）
                        data = trace.posterior[var_name].values

                        # 左側: 全サンプルのヒストグラム
                        flat_data = data.flatten()
                        axes[idx, 0].hist(flat_data, bins=50, density=True, alpha=0.7, edgecolor='black')
                        axes[idx, 0].set_xlabel('Value')
                        axes[idx, 0].set_ylabel('Density')
                        axes[idx, 0].set_title(f'{var_name} - Posterior Distribution')
                        axes[idx, 0].axvline(flat_data.mean(), color='red', linestyle='--', label='Mean')
                        axes[idx, 0].legend()

                        # 右側: チェーンごとのトレースプロット
                        for chain_idx in range(data.shape[0]):
                            axes[idx, 1].plot(data[chain_idx, :], alpha=0.6, label=f'Chain {chain_idx+1}')
                        axes[idx, 1].set_xlabel('Iteration')
                        axes[idx, 1].set_ylabel('Value')
                        axes[idx, 1].set_title(f'{var_name} - Trace')
                        if data.shape[0] <= 4:  # 4チェーン以下ならレジェンド表示
                            axes[idx, 1].legend()

                    plt.suptitle('Posterior Trace Plot', fontsize=16)
                    plt.tight_layout()
                    plots['trace_plot'] = self._fig_to_base64(fig)
                    plt.close(fig)
        except Exception as e:
            print(f"Trace plot error: {e}")
            import traceback
            traceback.print_exc()

        # Forest plot
        try:
            fig, ax = plt.subplots(figsize=(10, 6))
            az.plot_forest(trace, hdi_prob=hdi_prob, ax=ax)
            plots['forest_plot'] = self._fig_to_base64(fig)
            plt.close(fig)
        except Exception as e:
            print(f"Forest plot error: {e}")
            import traceback
            traceback.print_exc()

        # Posterior Predictive Check (if available)
        if self._has_observed_nodes() and hasattr(trace, 'posterior_predictive'):
            try:
                # posterior_predictiveグループから観測変数を取得
                observed_vars = [
                    node.name for node in self.model_data.nodes
                    if node.observed and node.name in trace.posterior_predictive.data_vars
                ]

                if observed_vars:
                    fig, ax = plt.subplots(figsize=(10, 6))

                    for var_name in observed_vars:
                        # posterior predictiveサンプルを取得
                        pp_data = trace.posterior_predictive[var_name].values.flatten()
                        ax.hist(pp_data, bins=50, alpha=0.5, label=f'{var_name} (predicted)', density=True, edgecolor='black')

                        # 実測値があればプロット
                        if hasattr(trace, 'observed_data') and var_name in trace.observed_data.data_vars:
                            obs_data = trace.observed_data[var_name].values.flatten()
                            ax.hist(obs_data, bins=50, alpha=0.5, label=f'{var_name} (observed)', density=True, edgecolor='black')

                    ax.set_xlabel('Value')
                    ax.set_ylabel('Density')
                    ax.set_title('Posterior Predictive Check')
                    ax.legend()
                    plots['ppc_plot'] = self._fig_to_base64(fig)
                    plt.close(fig)
            except Exception as e:
                print(f"PPC plot error: {e}")
                import traceback
                traceback.print_exc()

        return plots

    def generate_summary(
        self,
        trace: az.InferenceData,
        hdi_prob: float = 0.95
    ) -> Dict[str, Any]:
        """サマリー統計を生成"""
        try:
            summary_df = az.summary(trace, hdi_prob=hdi_prob)

            # デバッグ: 列名を確認
            print(f"Summary columns: {list(summary_df.columns)}")

            # DataFrameを辞書に変換
            summary_dict = {
                'parameters': {},
                'hdi_prob': hdi_prob
            }

            # HDI列名を特定（ArviZのバージョンによって異なる可能性がある）
            hdi_lower_col = None
            hdi_upper_col = None

            # 可能な列名のパターンを確認
            for col in summary_df.columns:
                if 'hdi' in col.lower():
                    if 'lower' in col.lower() or col.endswith('_lower'):
                        hdi_lower_col = col
                    elif 'upper' in col.lower() or col.endswith('_upper'):
                        hdi_upper_col = col
                    # hdi_3% と hdi_97% のようなパターン
                    elif '%' in col:
                        parts = col.split('_')
                        if len(parts) >= 2:
                            try:
                                prob_val = float(parts[-1].replace('%', ''))
                                if prob_val < 50:  # 下限
                                    hdi_lower_col = col
                                else:  # 上限
                                    hdi_upper_col = col
                            except:
                                pass

            print(f"HDI columns: lower={hdi_lower_col}, upper={hdi_upper_col}")

            for param_name in summary_df.index:
                param_data = {
                    'mean': float(summary_df.loc[param_name, 'mean']),
                    'sd': float(summary_df.loc[param_name, 'sd']),
                }

                # HDI区間
                if hdi_lower_col and hdi_lower_col in summary_df.columns:
                    param_data['hdi_lower'] = float(summary_df.loc[param_name, hdi_lower_col])
                if hdi_upper_col and hdi_upper_col in summary_df.columns:
                    param_data['hdi_upper'] = float(summary_df.loc[param_name, hdi_upper_col])

                # r_hat and ess_bulk (MCMC only)
                if 'r_hat' in summary_df.columns:
                    param_data['r_hat'] = float(summary_df.loc[param_name, 'r_hat'])
                if 'ess_bulk' in summary_df.columns:
                    param_data['ess_bulk'] = float(summary_df.loc[param_name, 'ess_bulk'])

                summary_dict['parameters'][param_name] = param_data

            return summary_dict
        except Exception as e:
            print(f"Summary generation error: {e}")
            import traceback
            traceback.print_exc()
            return {'error': str(e)}

    def extract_trace_samples(self, trace: az.InferenceData) -> str:
        """トレースデータをCSV形式に変換してBase64エンコード"""
        try:
            # posteriorデータからDataFrameを作成
            posterior_dict = {}

            # 各変数のデータを取得
            for var_name in trace.posterior.data_vars:
                data = trace.posterior[var_name].values

                # 多次元配列の場合は平坦化
                if data.ndim == 2:  # (chains, draws)
                    # チェーンとdrawのインデックスを追加
                    for chain_idx in range(data.shape[0]):
                        col_name = f"{var_name}_chain{chain_idx}"
                        posterior_dict[col_name] = data[chain_idx, :]
                elif data.ndim == 3:  # (chains, draws, shape)
                    # 各要素ごとに列を作成
                    for chain_idx in range(data.shape[0]):
                        for elem_idx in range(data.shape[2]):
                            col_name = f"{var_name}[{elem_idx}]_chain{chain_idx}"
                            posterior_dict[col_name] = data[chain_idx, :, elem_idx]
                else:
                    # その他の次元数の場合は全て平坦化
                    posterior_dict[var_name] = data.flatten()

            # DataFrameに変換
            df = pd.DataFrame(posterior_dict)

            # CSVに変換してBase64エンコード
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_data = csv_buffer.getvalue()

            # Base64エンコード
            csv_bytes = csv_data.encode('utf-8')
            b64_data = base64.b64encode(csv_bytes).decode('utf-8')

            return b64_data
        except Exception as e:
            print(f"Trace samples extraction error: {e}")
            import traceback
            traceback.print_exc()
            return ""

    def compute_model_comparison(
        self,
        trace: az.InferenceData,
        pm_model: pm.Model
    ) -> Dict[str, Optional[Dict[str, Any]]]:
        """LOOとWAICを計算してモデル比較指標を返す"""
        result = {
            'loo': None,
            'waic': None
        }

        # 観測ノードがない場合は計算できない
        if not self._has_observed_nodes():
            print("No observed nodes found - skipping LOO/WAIC computation")
            return result

        try:
            # LOO (Leave-One-Out Cross-Validation)
            loo_result = az.loo(trace, pointwise=True)
            # ELPDDataはSeriesのように扱える
            result['loo'] = {
                'elpd': float(loo_result.elpd_loo),
                'se': float(loo_result.se),
                'p_loo': float(loo_result.p_loo),
                'loo_i': None,
                'pareto_k': None,
                'warning': bool(loo_result.warning)
            }
            print(f"LOO computed: elpd_loo={result['loo']['elpd']:.2f}, p_loo={result['loo']['p_loo']:.2f}")
        except Exception as e:
            print(f"LOO computation error: {e}")
            import traceback
            traceback.print_exc()

        try:
            # WAIC (Watanabe-Akaike Information Criterion)
            waic_result = az.waic(trace, pointwise=False)
            # WAICのELPDDataの属性を確認
            print(f"WAIC index: {waic_result.index.tolist()}")

            # indexから適切な属性名を取得
            elpd_key = waic_result.index[0] if len(waic_result.index) > 0 else None
            p_key = waic_result.index[1] if len(waic_result.index) > 1 else None

            result['waic'] = {
                'elpd': float(waic_result[elpd_key]) if elpd_key else None,
                'se': float(waic_result.se) if hasattr(waic_result, 'se') else None,
                'p_waic': float(waic_result[p_key]) if p_key else None,
                'waic': float(waic_result.waic) if hasattr(waic_result, 'waic') else None,
                'warning': bool(waic_result.warning) if hasattr(waic_result, 'warning') else False
            }
            print(f"WAIC computed: elpd={result['waic']['elpd']:.2f}, p_waic={result['waic']['p_waic']:.2f}")
        except Exception as e:
            print(f"WAIC computation error: {e}")
            import traceback
            traceback.print_exc()

        return result

    def _fig_to_base64(self, fig) -> str:
        """MatplotlibのfigureをBase64文字列に変換"""
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        return img_base64
