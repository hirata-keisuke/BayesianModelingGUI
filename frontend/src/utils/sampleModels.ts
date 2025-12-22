import { ModelData, NodeType } from '../types/model'

export const sampleModels: Record<string, ModelData> = {
  'simple-normal': {
    nodes: [
      {
        id: 'mu',
        type: NodeType.VARIABLE,
        name: 'mu',
        distribution: 'Normal',
        parameters: { mu: 0, sigma: 10 },
        observed: false,
        position: { x: 200, y: 100 }
      },
      {
        id: 'sigma',
        type: NodeType.VARIABLE,
        name: 'sigma',
        distribution: 'HalfNormal',
        parameters: { sigma: 1 },
        observed: false,
        position: { x: 200, y: 250 }
      },
      {
        id: 'y',
        type: NodeType.VARIABLE,
        name: 'y',
        distribution: 'Normal',
        parameters: { mu: '@mu', sigma: '@sigma' },
        observed: true,
        position: { x: 200, y: 400 }
      }
    ],
    edges: [
      { id: 'mu-y', source: 'mu', target: 'y' },
      { id: 'sigma-y', source: 'sigma', target: 'y' }
    ]
  },

  'linear-regression': {
    nodes: [
      {
        id: 'alpha',
        type: NodeType.VARIABLE,
        name: 'alpha',
        distribution: 'Normal',
        parameters: { mu: 0, sigma: 10 },
        observed: false,
        position: { x: 50, y: 50 }
      },
      {
        id: 'beta',
        type: NodeType.VARIABLE,
        name: 'beta',
        distribution: 'Normal',
        parameters: { mu: 0, sigma: 10 },
        observed: false,
        position: { x: 250, y: 50 }
      },
      {
        id: 'x',
        type: NodeType.VARIABLE,
        name: 'x',
        distribution: 'Normal',
        parameters: { mu: 0, sigma: 1 },
        observed: true,
        position: { x: 450, y: 50 }
      },
      {
        id: 'mu',
        type: NodeType.COMPUTED,
        name: 'mu',
        expression: '@alpha + @beta * @x',
        parameters: {},
        observed: false,
        position: { x: 250, y: 200 }
      },
      {
        id: 'sigma',
        type: NodeType.VARIABLE,
        name: 'sigma',
        distribution: 'HalfNormal',
        parameters: { sigma: 1 },
        observed: false,
        position: { x: 450, y: 200 }
      },
      {
        id: 'y',
        type: NodeType.VARIABLE,
        name: 'y',
        distribution: 'Normal',
        parameters: { mu: '@mu', sigma: '@sigma' },
        observed: true,
        position: { x: 350, y: 350 }
      }
    ],
    edges: [
      { id: 'alpha-mu', source: 'alpha', target: 'mu' },
      { id: 'beta-mu', source: 'beta', target: 'mu' },
      { id: 'x-mu', source: 'x', target: 'mu' },
      { id: 'mu-y', source: 'mu', target: 'y' },
      { id: 'sigma-y', source: 'sigma', target: 'y' }
    ]
  },

  'beta-binomial': {
    nodes: [
      {
        id: 'alpha',
        type: NodeType.VARIABLE,
        name: 'alpha',
        distribution: 'Gamma',
        parameters: { alpha: 2, beta: 2 },
        observed: false,
        position: { x: 150, y: 100 }
      },
      {
        id: 'beta',
        type: NodeType.VARIABLE,
        name: 'beta_param',
        distribution: 'Gamma',
        parameters: { alpha: 2, beta: 2 },
        observed: false,
        position: { x: 350, y: 100 }
      },
      {
        id: 'p',
        type: NodeType.VARIABLE,
        name: 'p',
        distribution: 'Beta',
        parameters: { alpha: '@alpha', beta: '@beta_param' },
        observed: false,
        position: { x: 250, y: 250 }
      },
      {
        id: 'y',
        type: NodeType.VARIABLE,
        name: 'y',
        distribution: 'Binomial',
        parameters: { n: 10, p: '@p' },
        observed: true,
        position: { x: 250, y: 400 }
      }
    ],
    edges: [
      { id: 'alpha-p', source: 'alpha', target: 'p' },
      { id: 'beta-p', source: 'beta', target: 'p' },
      { id: 'p-y', source: 'p', target: 'y' }
    ]
  },

  'hierarchical': {
    nodes: [
      {
        id: 'mu_global',
        type: NodeType.VARIABLE,
        name: 'mu_global',
        distribution: 'Normal',
        parameters: { mu: 0, sigma: 10 },
        observed: false,
        position: { x: 250, y: 50 }
      },
      {
        id: 'sigma_global',
        type: NodeType.VARIABLE,
        name: 'sigma_global',
        distribution: 'HalfNormal',
        parameters: { sigma: 5 },
        observed: false,
        position: { x: 450, y: 50 }
      },
      {
        id: 'mu_group',
        type: NodeType.VARIABLE,
        name: 'mu_group',
        distribution: 'Normal',
        parameters: { mu: '@mu_global', sigma: '@sigma_global' },
        observed: false,
        position: { x: 250, y: 200 }
      },
      {
        id: 'sigma_obs',
        type: NodeType.VARIABLE,
        name: 'sigma_obs',
        distribution: 'HalfNormal',
        parameters: { sigma: 1 },
        observed: false,
        position: { x: 450, y: 200 }
      },
      {
        id: 'y',
        type: NodeType.VARIABLE,
        name: 'y',
        distribution: 'Normal',
        parameters: { mu: '@mu_group', sigma: '@sigma_obs' },
        observed: true,
        position: { x: 350, y: 350 }
      }
    ],
    edges: [
      { id: 'mu_global-mu_group', source: 'mu_global', target: 'mu_group' },
      { id: 'sigma_global-mu_group', source: 'sigma_global', target: 'mu_group' },
      { id: 'mu_group-y', source: 'mu_group', target: 'y' },
      { id: 'sigma_obs-y', source: 'sigma_obs', target: 'y' }
    ]
  }
}

export const sampleModelDescriptions: Record<string, { name: string; description: string }> = {
  'simple-normal': {
    name: 'Simple Normal Model',
    description: 'Basic normal distribution with mean and standard deviation priors'
  },
  'linear-regression': {
    name: 'Linear Regression',
    description: 'Linear regression with deterministic node: mu = alpha + beta * x'
  },
  'beta-binomial': {
    name: 'Beta-Binomial Model',
    description: 'Binomial likelihood with Beta prior on probability parameter'
  },
  'hierarchical': {
    name: 'Hierarchical Model',
    description: 'Two-level hierarchical model with group-level and observation-level parameters'
  }
}
