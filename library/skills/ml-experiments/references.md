# ML experiments: reference

## Seeds per framework
| Framework | Set this |
|---|---|
| Python, NumPy | `random.seed(s)`, `np.random.seed(s)` or `rng = np.random.default_rng(s)` |
| scikit-learn | `random_state=s` on every model and splitter, including the `cv=` splitter passed to `cross_val_score` |
| PyTorch | `torch.manual_seed(s)`, `torch.use_deterministic_algorithms(True)`, `worker_init_fn` and a seeded `generator` in `DataLoader` |
| TensorFlow / Keras | `tf.keras.utils.set_random_seed(s)`, `tf.config.experimental.enable_op_determinism()` |
| XGBoost / LightGBM | `seed` or `random_state`, and `deterministic=True` (LightGBM) |

## Splits that do not leak
| Data | Use |
|---|---|
| Independent rows | `train_test_split(..., stratify=y, random_state=s)`, then `StratifiedKFold` on the training part |
| Rows that belong together | `GroupShuffleSplit`, `GroupKFold` or `StratifiedGroupKFold` with the group column |
| Time order matters | Cut at a date, or `TimeSeriesSplit`; never shuffle |
| Preprocessing | Put it inside `Pipeline` / `ColumnTransformer`, so each fold fits it on its own training rows |

## Metrics
| Task | Default | Watch out for |
|---|---|---|
| Balanced classes | accuracy, F1 | A threshold chosen on test data |
| Rare positive class | PR AUC, recall at a fixed precision | Accuracy near 99% from always saying "no" |
| Ranking | ROC AUC, NDCG | AUC hides poor calibration |
| Regression | MAE (easy to explain), RMSE (punishes big misses) | Skewed targets: compare against the median baseline |
| Forecasts | MAE or MAPE per horizon | MAPE breaks near zero values |

Report the spread: the standard deviation across folds or across 3 to 5 seeds.

## Experiment log format
`experiments/log.md` holds one Markdown table. `exp-log.mjs add` creates it with this header:

```
| date | name | data | commit | params | seed | score | notes |
```

The score column holds `metric=value+-spread`, several separated by commas: `auc=0.81+-0.01, f1=0.66`. Name baseline
runs `baseline-...` so `exp-log.mjs best` can show the gap to them.

## Trackers, when the project already uses one
- **MLflow:** `mlflow.start_run(run_name=...)`, `mlflow.log_params(...)`, `mlflow.log_metrics(...)`,
  `mlflow.set_tag("git_commit", ...)`. The UI (`mlflow ui`) runs locally; a remote tracking server is an outside
  service and needs the user's OK.
- **DVC:** `dvc add data/raw` records the data version; `dvc exp run` and `dvc exp show` track runs. Pushing to a
  remote is an outward action.
- **Weights & Biases:** sends runs to an outside service by default. Use it only when the user set it up.

Installing any of these is a third-party install: ask first.

## Notebook hygiene
- Check: `node skills/ml-experiments/scripts/nb-strip.mjs --check <folder>`
- Strip: `node skills/ml-experiments/scripts/nb-strip.mjs <folder>`
- As a git filter, when the user agrees to install it: `nbstripout --install` strips on every commit.
