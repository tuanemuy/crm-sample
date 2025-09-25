# テスト実装の進捗を更新する

## 背景

- `docs/requirements.md` に要件を定義した
- `docs/backend.md` にバックエンドの実装例を記載した
- `docs/test.md` にテストの設計を記載した
- `docs/usecases.md` にページ構成とユースケースを定義した

## タスク

- `pnpm task list test` で実装すべきテストの一覧を確認する
- 各テストについて、以下の作業を繰り返す
    - 設計と実装を比較し、正しく実装されているか確認する
    - 実装されていたら、 `pnpm task done test ${id or usecaseName}` を実行して進捗を更新する
    - 実装されていなかったら、 `pnpm task wip test ${id or usecaseName} ${comment}` を実行して進捗を更新する

## 備考

- 実装に合わせたテストではなく、仕様を表現するテストであることを確認する
- テストは実行しない
