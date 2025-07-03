# バックエンドの進捗を更新する

## 背景

- `docs/requirements.md` に要件を定義した
- `docs/backend.md` にバックエンドの実装例を記載した
- `docs/usecases.md` にページ構成とユースケースを定義した

## タスク

- `pnpm task list usecase` でユースケース一覧を確認する
- 各ユースケースについて、以下の作業を繰り返す
    - 設計と実装を比較し、正しく実装されているか確認する
    - 実装されていたら、 `pnpm task done usecase ${id or usecaseName}` を実行して進捗を更新する
    - 実装されていなかったら、 `pnpm task wip usecase ${id or usecaseName} ${comment}` を実行して進捗を更新する

## 備考

- ファイルが存在しても、実装が完了していない場合がある
- 仮の実装になっている場合がある
- レイヤー、ドメインごとに細かく調査する
