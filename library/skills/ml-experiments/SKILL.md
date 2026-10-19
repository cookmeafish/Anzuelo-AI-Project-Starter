---
name: ml-experiments
description: Runs machine-learning work so results can be trusted and repeated. Every training or evaluation run is an experiment logged with its data version, code version, parameters, seed and scores; raw data is never edited; train, validation and test data never leak into each other; notebooks are committed without outputs or secrets; and the best model is picked from the log, not from memory. Use when the user asks to train, tune, evaluate or compare models, run an experiment, try hyperparameters, check for data leakage or overfitting, clean notebooks, or pick the best model.
triggers: train the model, retrain the model, training run, run an experiment, ml experiment, machine learning model, try hyperparameters, tune hyperparameters, hyperparameter search, evaluate the model, model evaluation, compare the models, compare experiments, best model, model accuracy, f1 score, auc score, cross validation, train test split, data leakage, overfitting, clear notebook outputs, strip the notebook, experiment log
---
# ML experiments: results you can repeat

A model score with no record of the data, code and seed behind it cannot be repeated, compared or trusted. This skill
makes every run an experiment with a log row, keeps the test data honest, and picks winners from the log.

Say at the start: "Running this as a logged experiment (ml-experiments skill)."

## What the other skills already cover
- **Looking at a new dataset, data quality, charts:** the data-analysis skill (sections A, B and E), when enabled.
  Profile the data with it before the first experiment.
- **Numbers in the answer trace to output from this turn:** the research skill, section D. Scores come from runs made
  or log rows read this turn.
- **A training script that crashes or gives odd results:** the debug skill.
- **Keys and tokens:** `docs/security.md` and the security-review skill. Before a model or notebook is shared, run it.
- **Publishing a model or dataset** (a model hub, a paper, a demo): an outward action. Prepare it, then ask.

Scripts (Node only, nothing to install): `skills/ml-experiments/scripts/exp-log.mjs` writes log rows and picks the
best run; `skills/ml-experiments/scripts/nb-strip.mjs` clears notebook outputs and flags secrets.
Commands per framework are in [references.md](references.md).

## Pick the situation
| Situation | Do |
|---|---|
| Train, retrain or tune a model | **A**, then **B**, **C** |
| Evaluate or score a model | **B** (the split must already be fixed), then **C** |
| "Which model is best?", compare runs | **D** |
| Scores look too good, or test scores drop in use | **E** |
| A notebook is about to be committed or shared | **F** |

## A. Set up the experiment
1. Name it and write the question it answers in one line: "Does adding the price history raise recall above 0.70?"
   Say which result would change a decision.
2. Agree the metric with the user, or take it from `docs/BRIEF.md`. Write it down before the first run, so the metric
   is not chosen after seeing the scores.
3. Keep raw data as it came: `data/raw/` is never edited (ask the user before touching it at all). Cleaning is a
   script that reads `data/raw/` and writes `data/processed/`, so it can be run again.
4. Fix every seed (Python `random`, NumPy, the framework, the data loader workers). Note anything that stays
   non-deterministic, such as some GPU kernels.
5. Commit the code before runs worth keeping. A run on uncommitted code is logged as `+dirty`.

## B. Split once, and never peek
1. Split into train, validation and test once, with a fixed seed, and save the split (row IDs or files), so every
   experiment uses the same one.
2. Split by time when the model predicts the future (train on the past, test on later rows). Split by group when rows
   belong together (one patient, one user, one device): all of a group's rows go to one side.
3. Fit every preprocessing step (scaling, encoding, imputing, feature selection, oversampling) on the training split
   only, inside a pipeline, then apply it to the others.
4. Tune on validation data or with cross-validation on the training split. The test split is scored once, for the
   final model, and never used to choose between models.
5. Small data: use k-fold cross-validation (5 or 10 folds) and report the mean and the spread across folds.

## C. Run and log
1. Train and score a **baseline** first (the majority class, a mean, a linear model, or the current model in use),
   logged with a name starting `baseline`.
2. Run the experiment. Score it on the agreed metric, with the spread across folds or seeds.
3. Log it right away:
   `node skills/ml-experiments/scripts/exp-log.mjs add experiments/log.md --name <run> --data <data folder> --params "<k=v, ...>" --seed <n> --score "<metric>=<value>+-<spread>"`
   It adds the date, a short hash of the data and the git commit. A run that is not logged did not happen.
4. MLflow, Weights & Biases or DVC, when the project already uses one: log there as well, and keep the row in
   `experiments/log.md` with the tracker's run ID in the notes, so the comparison works without the tracker.
5. Save the model file with the run name. Files over about 50 MB go to Git LFS or DVC, never straight into git.
   Ask before installing either.

## D. Compare and choose
1. Read the log: `node skills/ml-experiments/scripts/exp-log.mjs best experiments/log.md --metric <name>` (add
   `--lower` for loss or error metrics).
2. Name the winner, its gap to the runner-up and to the baseline, and whether the gap is larger than the spread. A
   gap inside the spread is a tie: prefer the simpler or cheaper model.
3. Only now score the winner on the test split, once, and log that row too.
4. Say what was not tried, and what the scores do not show (a subgroup that does worse, data from a later period).

## E. Leakage and overfitting
Signs: a validation score far above what similar work reaches, a single feature that predicts almost perfectly, or
training scores far above validation scores.
1. Look for features that are only known after the outcome (a refund date in a churn model, an ID that encodes the
   label).
2. Check that no row, user or time period is on both sides of a split.
3. Check that every preprocessing step was fit on training data only (B.3).
4. Overfitting: compare training and validation scores. Fix with more data, a simpler model, regularisation or early
   stopping, and log each attempt as its own run.

## F. Notebooks
1. Before a commit or share: `node skills/ml-experiments/scripts/nb-strip.mjs --check <notebook or folder>`.
2. On FAIL for outputs: `node skills/ml-experiments/scripts/nb-strip.mjs <notebook or folder>` clears outputs and
   execution counts in place. The cell code is not touched. `nbstripout` or
   `jupyter nbconvert --clear-output --inplace` do the same when installed.
3. On FAIL for a secret: move the value to an environment variable or an ignored `.env` file, and tell the user the
   key may need replacing if it was ever committed or shared.
4. Long code in notebooks moves into a module the notebook imports, so it can be tested and reused.

## Done when
- [ ] Every training or evaluation run this turn has a row in `experiments/log.md` (or the project's log) with data hash, commit, parameters, seed and score (hook: experiment-logged).
- [ ] No file under `data/raw/` changed (judgment: the protected-files rule covers it when `data/raw/**` is in protectedOriginals).
- [ ] The test split was scored only for the final model (judgment: shows only in the work).
- [ ] The winner was named from the log with its gap to the runner-up and the baseline (judgment: needs a reader).
- [ ] Notebooks being committed passed `nb-strip.mjs --check` (judgment: run it in step F).

## Pitfalls
- Choosing the metric, the threshold or the split after seeing the scores.
- Scaling or encoding the whole dataset before splitting, so the test rows shaped the training.
- Random splits on time series or on grouped rows, which make the model look far better than it is.
- Comparing runs from memory or from a chat message instead of the log.
- Calling a 0.005 gain a win when the spread between seeds is 0.01.
- Retraining on new data and keeping the old data hash in the log.
- A notebook committed with output cells that hold rows of personal data or a printed key.
