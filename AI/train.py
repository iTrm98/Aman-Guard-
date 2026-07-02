"""
Usage:
    python train.py --data cleand.csv
    python train.py --data cleand.csv --test-size 0.2 --C 5.0
"""

import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline

from text_utils import clean_text

TEXT_COL = "Email Text"
LABEL_COL = "Email Type"
POSITIVE_LABEL = "Phishing Email"  


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    missing = {TEXT_COL, LABEL_COL} - set(df.columns)
    if missing:
        sys.exit(f"Missing expected column(s): {missing}. Found: {list(df.columns)}")

    before = len(df)
    df = df.dropna(subset=[TEXT_COL, LABEL_COL]).copy()
    df = df[df[TEXT_COL].str.strip().astype(bool)]
    dropped = before - len(df)
    if dropped:
        print(f"Dropped {dropped} rows with empty/missing text or label.")

    df["label"] = (df[LABEL_COL] == POSITIVE_LABEL).astype(int)
    df["clean_text"] = df[TEXT_COL].apply(clean_text)
    return df


def build_pipeline(C: float) -> Pipeline:
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.95,
                    sublinear_tf=True,
                    stop_words="english",
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    C=C,
                    max_iter=1000,
                    class_weight="balanced", 
                ),
            ),
        ]
    )


def main():
    parser = argparse.ArgumentParser(description="Train ham/phishing email classifier")
    parser.add_argument("--data", default="cleand.csv", help="Path to training CSV")
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--C", type=float, default=None, help="LogReg inverse regularization strength (skip grid search if set)")
    parser.add_argument("--out-dir", default="models", help="Where to save model + metrics")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading data from {args.data} ...")
    df = load_data(args.data)
    print(f"Rows: {len(df)} | Phishing: {df['label'].sum()} | Safe: {(df['label'] == 0).sum()}")

    X_train, X_test, y_train, y_test = train_test_split(
        df["clean_text"], df["label"],
        test_size=args.test_size, random_state=args.seed, stratify=df["label"],
    )

    if args.C is not None:
        pipeline = build_pipeline(C=args.C)
        print(f"Training with fixed C={args.C} ...")
        pipeline.fit(X_train, y_train)
    else:
        print("Running small grid search over C ...")
        base = build_pipeline(C=1.0)
        grid = GridSearchCV(
            base,
            param_grid={"clf__C": [0.1, 1.0, 3.0, 10.0]},
            scoring="f1",
            cv=5,
            n_jobs=-1,
        )
        grid.fit(X_train, y_train)
        pipeline = grid.best_estimator_
        print(f"Best C: {grid.best_params_['clf__C']} (CV F1: {grid.best_score_:.4f})")

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    report = classification_report(
        y_test, y_pred, target_names=["Safe Email", "Phishing Email"], output_dict=True
    )
    cm = confusion_matrix(y_test, y_pred).tolist()
    auc = roc_auc_score(y_test, y_proba)
    f1 = f1_score(y_test, y_pred)

    print("\n=== Classification report ===")
    print(classification_report(y_test, y_pred, target_names=["Safe Email", "Phishing Email"]))
    print(f"ROC-AUC: {auc:.4f}")
    print("Confusion matrix [[TN, FP], [FN, TP]]:")
    print(np.array(cm))

    feature_names = pipeline.named_steps["tfidf"].get_feature_names_out()
    coefs = pipeline.named_steps["clf"].coef_[0]
    top_phish = feature_names[np.argsort(coefs)[-15:][::-1]]
    top_safe = feature_names[np.argsort(coefs)[:15]]
    print("\nTop phishing-indicative terms:", ", ".join(top_phish))
    print("Top safe-indicative terms:    ", ", ".join(top_safe))

    model_path = out_dir / "phish_model.joblib"
    joblib.dump(pipeline, model_path)

    metrics = {
        "n_train": len(X_train),
        "n_test": len(X_test),
        "roc_auc": auc,
        "f1_phishing": f1,
        "confusion_matrix": cm,
        "classification_report": report,
        "top_phishing_terms": top_phish.tolist(),
        "top_safe_terms": top_safe.tolist(),
    }
    with open(out_dir / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved model -> {model_path}")
    print(f"Saved metrics -> {out_dir / 'metrics.json'}")


if __name__ == "__main__":
    main()
