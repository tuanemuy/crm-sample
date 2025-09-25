# テスト実装のタスク化

## 背景

- `pnpm task list usecase` でユースケースの一覧を確認することができる
- 各ユースケースを `src/core/aplication` ディレクトリにアプリケーションサービスとして実装した
- 同じディレクトリにそれぞれのテストを実装している

## タスク

- `pnpm task add test <jsonArray>` で各アプリケーションサービスのテストの実装をタスク化する

## 方法

```
pnpm task add test '[{
  "customId": "test_${ユースケース名（camelCase）}",
  "name": "${ユースケース名（日本語）}のテスト",
  "description": "${テストの説明}"
}, {
  "customId": "test_${ユースケース名2（camelCase）}",
  "name": "${ユースケース名2（日本語）}のテスト",
  "description": "${テスト2の説明}"
}]'
```

### タスクの確認

```
pnpm task list test
```
