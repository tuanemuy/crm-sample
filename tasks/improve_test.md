# テストを改善する

## 背景

- `docs/requirements.md` に要件を定義した
- `docs/backend.md` にバックエンドの設計を記載した
- `docs/test.md` にテストの設計を記載した
- `docs/usecases.tsv` に想定されるページ構成とユースケースを定義した

## タスク

- テストを実行する
- 実装に誤りがあれば修正する

## ワークフロー

### 1. 未完了のテストを確認する

```
pnpm task todo test
```

### 2. テストを実行する

```
pnpm test src/core/application/${domain}/${usecase}.test.ts
```

### 3. 実装に誤りがあれば修正する

- テストを通すことを目的とした実装は行わない
- テストに誤りがある場合は、テスト側を修正する

### 4. テストが通るまで2〜3を繰り返す

### 5. 完了したテストを報告する

```
pnpm task done test ${id}
```
