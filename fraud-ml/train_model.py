import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
import joblib

# Generate synthetic training data
np.random.seed(42)
n_samples = 10000

X = np.random.rand(n_samples, 5)
X[:, 0] = X[:, 0] * 500000  # amount
X[:, 1] = X[:, 1] * 24       # hour
X[:, 2] = X[:, 2] * 10       # velocity
X[:, 3] = X[:, 3] * 1000     # country hash
X[:, 4] = X[:, 4] * 1000     # merchant hash

# Labels: 1 = fraud, 0 = normal
y = np.zeros(n_samples)
# High amount + unusual hour = likely fraud
fraud_mask = (X[:, 0] > 200000) & ((X[:, 1] < 6) | (X[:, 1] > 22)) & (X[:, 2] > 5)
y[fraud_mask] = 1

model = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
model.fit(X, y)

joblib.dump(model, "fraud_model.pkl")
print("Model trained and saved as fraud_model.pkl")
print(f"Fraud samples: {y.sum()}, Normal samples: {(y==0).sum()}")
