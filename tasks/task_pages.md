# ページ実装のタスク化

## 背景

- `docs/requirements.md` に要件を定義した
- `docs/pages.md` にページ構成を記載した

## タスク

- 各ページの実装をタスク化する

## 方法

### タスクの追加

```
pnpm task add page '[{
  "customId": "${パス}",
  "name": "${ページ名}",
  "description": "${ページの説明}"
}, {
  "customId": "${パス2}",
  "name": "${ページ名2}",
  "description": "${ページの説明2}"
}]'
```

### タスクの確認

```
pnpm task list page
```
