import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

np.random.seed(42)
X = np.random.rand(100, 1) * 10
true_slope = 2.5
true_intercept = 5
y = true_slope * X + true_intercept + np.random.randn(100, 1) * 3 # test

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

plt.figure(figsize=(16, 9))
plt.scatter(X, y, color='blue')
plt.plot(X, model.predict(X), color='red')
plt.axis('off')
plt.legend().remove()
plt.savefig('../images/linear_regression_background.png', format='png', dpi=300, transparent=True)
plt.show()
