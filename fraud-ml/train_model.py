import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
import joblib

"""
Trains on the same 9 engineered features main.py computes at inference time:
amount, hour, velocity, country_risk, merchant_risk, is_round_amount,
is_weekend, type_risk, amount_velocity_interaction.

Synthetic data models several distinct fraud archetypes instead of a single
"big amount + odd hour" rule, so the model can pick up on patterns that don't
all look alike:
  1. Account takeover: high amount + high velocity, often outside trusted countries
  2. Structuring: round-number amounts, repeated, to avoid a single large flag
  3. Card testing / rapid withdrawal: many small-to-medium WITHDRAW/PAYMENT ops in a burst
  4. Late-night foreign payments to unknown merchants
"""

rng = np.random.default_rng(42)
n_samples = 30000

amount = rng.uniform(10, 500000, n_samples)
hour = rng.integers(0, 24, n_samples)
velocity = rng.integers(0, 15, n_samples)
country_risk = rng.integers(0, 2, n_samples).astype(float)
merchant_risk = rng.integers(0, 2, n_samples).astype(float)
is_weekend = rng.integers(0, 2, n_samples).astype(float)
type_risk = rng.integers(0, 2, n_samples).astype(float)

# Structuring: force some amounts to round thousands
round_mask = rng.random(n_samples) < 0.15
amount[round_mask] = (rng.integers(1, 500, round_mask.sum()) * 1000).astype(float)
is_round_amount = (amount % 1000 == 0).astype(float) * (amount > 1000)

amount_velocity_interaction = amount * velocity

X = np.column_stack([
    amount, hour, velocity, country_risk, merchant_risk,
    is_round_amount, is_weekend, type_risk, amount_velocity_interaction
])

y = np.zeros(n_samples)

# Archetype 1: account takeover
takeover = (amount > 150000) & (velocity > 6) & (country_risk == 1)
# Archetype 2: structuring
structuring = (is_round_amount == 1) & (velocity > 3) & (amount > 5000)
# Archetype 3: card testing / rapid withdrawal burst
card_testing = (velocity > 9) & (type_risk == 1) & (amount > 1000)
# Archetype 4: late-night foreign payment to unknown merchant
night_foreign = ((hour < 6) | (hour > 23)) & (country_risk == 1) & (merchant_risk == 1) & (amount > 20000)

fraud_mask = takeover | structuring | card_testing | night_foreign
y[fraud_mask] = 1

# Light label noise so the model doesn't overfit to exact thresholds
flip = rng.random(n_samples) < 0.02
y[flip] = 1 - y[flip]

model = GradientBoostingClassifier(n_estimators=150, max_depth=4, learning_rate=0.1, random_state=42)
model.fit(X, y)

joblib.dump(model, "fraud_model.pkl")
print("Model trained and saved as fraud_model.pkl")
print(f"Fraud samples: {int(y.sum())}, Normal samples: {int((y == 0).sum())}")
print("Feature importances:")
for name, imp in zip(
    ["amount", "hour", "velocity", "country_risk", "merchant_risk",
     "is_round_amount", "is_weekend", "type_risk", "amount_velocity_interaction"],
    model.feature_importances_
):
    print(f"  {name}: {imp:.4f}")
