import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder

def train_demand_forecasting():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "historical_demand_data.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Historical dataset not found at {data_path}")

    print(f"Loading historical demand records from: {data_path}")
    df = pd.read_csv(data_path)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["hospital_id", "blood_group", "date"]).reset_index(drop=True)

    # Feature Engineering
    # 1. Day of week, month, day of month
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day

    # 2. Lag features (previous day demand and 7-day rolling mean)
    df["lag_1_demand"] = df.groupby(["hospital_id", "blood_group"])["requested_units"].shift(1)
    df["lag_7_rolling_avg"] = df.groupby(["hospital_id", "blood_group"])["requested_units"].transform(
        lambda x: x.shift(1).rolling(7, min_periods=1).mean()
    )

    # Fill NaN values in lag features
    df["lag_1_demand"] = df["lag_1_demand"].bfill()
    df["lag_7_rolling_avg"] = df["lag_7_rolling_avg"].bfill()

    # Features and Target
    feature_cols = [
        "hospital_id",
        "blood_group",
        "day_of_week",
        "month",
        "day",
        "is_weekend",
        "is_emergency",
        "lag_1_demand",
        "lag_7_rolling_avg"
    ]
    target_col = "requested_units"

    # One-hot encode categorical features (hospital_id, blood_group)
    encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    cat_features = encoder.fit_transform(df[["hospital_id", "blood_group"]])
    cat_feature_names = encoder.get_feature_names_out(["hospital_id", "blood_group"])

    num_features = df[["day_of_week", "month", "day", "is_weekend", "is_emergency", "lag_1_demand", "lag_7_rolling_avg"]].values
    X = np.hstack([cat_features, num_features])
    y = df[target_col].values

    # Train / Test Split (Time-aware: last 20% for testing)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    print(f"Training RandomForestRegressor on {len(X_train)} samples, testing on {len(X_test)} samples...")
    model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    metrics = {
        "MAE": round(float(mae), 4),
        "RMSE": round(float(rmse), 4),
        "R2": round(float(r2), 4),
        "model_type": "RandomForestRegressor",
        "training_samples": len(X_train),
        "testing_samples": len(X_test)
    }

    print("\n--- Model Evaluation Results ---")
    print(f"Mean Absolute Error (MAE): {metrics['MAE']} units")
    print(f"Root Mean Squared Error (RMSE): {metrics['RMSE']} units")
    print(f"R-squared Score (R2): {metrics['R2']}")

    # Save Model Artifacts
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_save_path = os.path.join(models_dir, "demand_forecast_model.pkl")
    encoder_save_path = os.path.join(models_dir, "encoder.pkl")
    metrics_save_path = os.path.join(models_dir, "evaluation_metrics.json")

    joblib.dump(model, model_save_path)
    joblib.dump(encoder, encoder_save_path)
    with open(metrics_save_path, "w") as f:
        json.dump(metrics, f, indent=2)

    # Generate 7-day and 14-day forecasts
    hospitals = df["hospital_id"].unique()
    blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    
    forecast_results = {
        "generated_at": datetime.now().isoformat(),
        "metrics": metrics,
        "forecast_7_days": {},
        "forecast_14_days": {}
    }

    last_date = df["date"].max()

    # Aggregate 7-day and 14-day demand forecast per blood group
    for bg in blood_groups:
        total_7d = 0
        total_14d = 0
        daily_breakdown = []

        for day_ahead in range(1, 15):
            target_date = last_date + timedelta(days=day_ahead)
            dow = target_date.weekday()
            is_wknd = 1 if dow >= 5 else 0
            
            day_demand_sum = 0
            for hosp in hospitals:
                # Sample recent lag for feature
                recent_avg = df[(df["hospital_id"] == hosp) & (df["blood_group"] == bg)]["requested_units"].tail(7).mean()
                cat_encoded = encoder.transform([[hosp, bg]])
                num_vals = np.array([[dow, target_date.month, target_date.day, is_wknd, 0, recent_avg, recent_avg]])
                feat = np.hstack([cat_encoded, num_vals])
                pred = max(1, round(float(model.predict(feat)[0])))
                day_demand_sum += pred

            if day_ahead <= 7:
                total_7d += day_demand_sum
            total_14d += day_demand_sum

            daily_breakdown.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "day_ahead": day_ahead,
                "predicted_units": day_demand_sum
            })

        forecast_results["forecast_7_days"][bg] = {
            "total_estimated_units": total_7d,
            "daily_average": round(total_7d / 7, 1)
        }
        forecast_results["forecast_14_days"][bg] = {
            "total_estimated_units": total_14d,
            "daily_average": round(total_14d / 14, 1),
            "daily_breakdown": daily_breakdown
        }

    forecast_json_path = os.path.join(os.path.dirname(__file__), "forecast_output.json")
    with open(forecast_json_path, "w") as f:
        json.dump(forecast_results, f, indent=2)

    print(f"\nForecast output saved to: {forecast_json_path}")
    print("Forecasting model trained and exported successfully!")

if __name__ == "__main__":
    train_demand_forecasting()
