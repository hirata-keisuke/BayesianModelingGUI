from typing import Dict, Any
import pymc as pm

DISTRIBUTIONS = {
    "Normal": {
        "class": pm.Normal,
        "params": {
            "mu": {"type": "float", "default": 0, "required": True},
            "sigma": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Normal (Gaussian) distribution"
    },
    "Beta": {
        "class": pm.Beta,
        "params": {
            "alpha": {"type": "float", "default": 1, "required": True, "constraint": "> 0"},
            "beta": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Beta distribution (0, 1)"
    },
    "Gamma": {
        "class": pm.Gamma,
        "params": {
            "alpha": {"type": "float", "default": 1, "required": True, "constraint": "> 0"},
            "beta": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Gamma distribution"
    },
    "Exponential": {
        "class": pm.Exponential,
        "params": {
            "lam": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Exponential distribution"
    },
    "Uniform": {
        "class": pm.Uniform,
        "params": {
            "lower": {"type": "float", "default": 0, "required": True},
            "upper": {"type": "float", "default": 1, "required": True}
        },
        "support": "continuous",
        "description": "Uniform distribution"
    },
    "HalfNormal": {
        "class": pm.HalfNormal,
        "params": {
            "sigma": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Half-normal distribution (non-negative)"
    },
    "StudentT": {
        "class": pm.StudentT,
        "params": {
            "nu": {"type": "float", "default": 1, "required": True, "constraint": "> 0"},
            "mu": {"type": "float", "default": 0, "required": True},
            "sigma": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Student's t-distribution"
    },
    "Cauchy": {
        "class": pm.Cauchy,
        "params": {
            "alpha": {"type": "float", "default": 0, "required": True},
            "beta": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Cauchy distribution"
    },
    "HalfCauchy": {
        "class": pm.HalfCauchy,
        "params": {
            "beta": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Half-Cauchy distribution (non-negative)"
    },
    "LogNormal": {
        "class": pm.LogNormal,
        "params": {
            "mu": {"type": "float", "default": 0, "required": True},
            "sigma": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Log-normal distribution (positive values only)"
    },
    "InverseGamma": {
        "class": pm.InverseGamma,
        "params": {
            "alpha": {"type": "float", "default": 1, "required": True, "constraint": "> 0"},
            "beta": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "continuous",
        "description": "Inverse gamma distribution (often used for variance priors)"
    },
    "MvNormal": {
        "class": pm.MvNormal,
        "params": {
            "mu": {"type": "array", "default": None, "required": True},
            "cov": {"type": "array", "default": None, "required": False},
            "chol": {"type": "array", "default": None, "required": False},
            "tau": {"type": "array", "default": None, "required": False}
        },
        "support": "continuous",
        "description": "Multivariate normal distribution (specify one of: cov, chol, or tau)"
    },
    "LKJCholeskyCov": {
        "class": pm.LKJCholeskyCov,
        "params": {
            "n": {"type": "int", "default": 2, "required": True, "constraint": ">= 2"},
            "eta": {"type": "float", "default": 1, "required": True, "constraint": "> 0"},
            "sd_dist": {"type": "node_reference", "default": None, "required": True, "constraint": "Reference to a distribution node (will be converted to .dist() format)"}
        },
        "support": "continuous",
        "description": "LKJ Cholesky covariance distribution for hierarchical models"
    },
    "Bernoulli": {
        "class": pm.Bernoulli,
        "params": {
            "p": {"type": "float", "default": 0.5, "required": True, "constraint": "0 <= p <= 1"}
        },
        "support": "discrete",
        "description": "Bernoulli distribution"
    },
    "Binomial": {
        "class": pm.Binomial,
        "params": {
            "n": {"type": "int", "default": 1, "required": True, "constraint": "> 0"},
            "p": {"type": "float", "default": 0.5, "required": True, "constraint": "0 <= p <= 1"}
        },
        "support": "discrete",
        "description": "Binomial distribution"
    },
    "Poisson": {
        "class": pm.Poisson,
        "params": {
            "mu": {"type": "float", "default": 1, "required": True, "constraint": "> 0"}
        },
        "support": "discrete",
        "description": "Poisson distribution"
    },
    "Categorical": {
        "class": pm.Categorical,
        "params": {
            "p": {"type": "array", "default": None, "required": True, "constraint": "sum to 1"}
        },
        "support": "discrete",
        "description": "Categorical distribution"
    },
    "Dirichlet": {
        "class": pm.Dirichlet,
        "params": {
            "a": {"type": "array", "default": None, "required": True, "constraint": "all elements > 0"}
        },
        "support": "continuous",
        "description": "Dirichlet distribution (simplex, sum to 1)"
    },
    "Deterministic": {
        "class": pm.Deterministic,
        "params": {
            "var": {"type": "any", "default": None, "required": True}
        },
        "support": "deterministic",
        "description": "Deterministic transformation"
    }
}


def get_all_distributions() -> Dict[str, Any]:
    """分布のリストを取得（classオブジェクトは文字列に変換）"""
    return {
        k: {
            "params": v["params"],
            "support": v["support"],
            "description": v["description"]
        }
        for k, v in DISTRIBUTIONS.items()
    }


def get_distribution_params(dist_name: str) -> Dict[str, Any]:
    """特定の分布のパラメータ情報を取得"""
    return DISTRIBUTIONS.get(dist_name, {}).get("params", {})
