# バックエンドの実装を行う

## 背景

- `docs/requirements.md` に要件を定義した
- `docs/backend.md` にバックエンドの実装例を記載した
- `docs/usecases.md` にユースケースを定義した

## タスク

- 設計に従ってバックエンドの実装を行う

## ワークフロー

### 1. 未実装のユースケースを確認する

```
pnpm task todo usecase
```

### 2. 実装したユースケースを報告する

```
pnpm task done usecase ${id}
```

### 3. テストとリンターを実行する
