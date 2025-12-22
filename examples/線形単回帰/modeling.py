import pymc as pm
import numpy as np
import pandas as pd

# Data loading
data = pd.read_csv('linear_regression.csv')
y_data = data['y'].values
X_data = data['X'].values

# Model definition
with pm.Model() as model:
    alpha = pm.Normal('alpha', mu=-1, sigma=2)
    beta = pm.Normal('beta', mu=0, sigma=1)
    X = pm.Data('X', X_data)
    sigma = pm.HalfCauchy('sigma', beta=10)
    mu = alpha + beta * X
    y = pm.Normal('y', mu=mu, sigma=sigma, observed=y_data)

# Model created successfully!
# You can now run inference with:
# with model:
#     trace = pm.sample(2000, tune=1000)