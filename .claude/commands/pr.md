---
description: developブランチからmainブランチへのPull Requestを作成する
---

developブランチからmainブランチへのPull Requestを作成してください。

以下の手順で実行してください：

1. 現在のブランチがdevelopであることを確認（`git branch --show-current`）
2. developブランチの最新の変更を取得（`git fetch origin develop`）
3. リモートと同期（`git pull origin develop`）
4. `git log main..develop`でmainとdevelopの差分のコミット履歴を確認
5. `git diff main...develop`でmainブランチとの差分を確認
6. すべてのコミットとdiffを分析して、Pull Requestのタイトルと本文を作成
7. `gh pr create`コマンドを使用してPull Requestを作成
   - base: main
   - head: develop
   - タイトル: コミット履歴から適切なタイトルを生成
   - 本文: 以下の形式で作成：
     ```
     ## 変更内容
     （差分から抽出した主な変更点を箇条書きで記載）

     ## 詳細
     （各変更の詳細説明）

     ## テスト
     - [ ] `npm test` が通ることを確認
     - [ ] `npm run build` が成功することを確認

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```

8. 作成されたPull RequestのURLを表示

注意：
- developブランチにいない場合は警告を出す
- コミットがない場合は、Pull Request作成をスキップ
- PRの説明は日本語で作成
