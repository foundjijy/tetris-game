// GitHub APIランキング管理クラス
class GitHubRanking {
    constructor() {
        this.rankingUrl = 'ranking.json';
        this.githubApiUrl = 'https://api.github.com/repos';
        this.repository = 'YOUR_USERNAME/YOUR_REPO_NAME'; // 実際のリポジトリ名に変更
        this.token = 'YOUR_GITHUB_TOKEN'; // 実際のトークンに変更
        this.maxRankings = 10;
    }

    // ランキングを取得
    async getRankings() {
        try {
            const response = await fetch(this.rankingUrl + '?t=' + Date.now());
            if (!response.ok) {
                throw new Error('ランキングの取得に失敗しました');
            }
            const rankings = await response.json();
            return rankings.sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error('ランキング取得エラー:', error);
            return [];
        }
    }

    // スコアをGitHub API経由で保存
    async saveScore(playerName, score) {
        try {
            const now = new Date();
            const newScore = {
                name: playerName,
                score: score,
                date: now.toLocaleString('ja-JP'),
                timestamp: now.getTime()
            };

            // GitHub APIを使ってリポジトリディスパッチイベントを送信
            const response = await fetch(`https://api.github.com/repos/${this.repository}/dispatches`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'update-ranking',
                    client_payload: {
                        score_data: newScore
                    }
                })
            });

            if (!response.ok) {
                throw new Error('GitHub API エラー: ' + response.status);
            }

            console.log('スコアがGitHubに送信されました:', newScore);
            
            // ローカルストレージにも保存（フォールバック用）
            this.saveToLocal(newScore);
            
            return true;
        } catch (error) {
            console.error('スコア保存エラー:', error);
            // エラー時はローカルに保存
            this.saveToLocal({
                name: playerName,
                score: score,
                date: new Date().toLocaleString('ja-JP'),
                timestamp: new Date().getTime()
            });
            return false;
        }
    }

    // ローカルストレージに保存
    saveToLocal(scoreData) {
        try {
            const localRankings = this.getLocalRankings();
            localRankings.push(scoreData);
            localRankings.sort((a, b) => b.score - a.score);
            const topRankings = localRankings.slice(0, this.maxRankings);
            localStorage.setItem('tetrisLocalRankings', JSON.stringify(topRankings));
        } catch (error) {
            console.error('ローカル保存エラー:', error);
        }
    }

    // ローカルストレージからランキングを取得
    getLocalRankings() {
        const saved = localStorage.getItem('tetrisLocalRankings');
        return saved ? JSON.parse(saved) : [];
    }

    // 統合ランキングを取得（GitHub + ローカル）
    async getCombinedRankings() {
        try {
            // GitHubからランキングを取得
            const githubRankings = await this.getRankings();
            
            // ローカルランキングを取得
            const localRankings = this.getLocalRankings();
            
            // 両方を結合して重複を除去
            const allRankings = [...githubRankings, ...localRankings];
            const uniqueRankings = this.removeDuplicates(allRankings);
            
            // スコア順でソート
            return uniqueRankings.sort((a, b) => b.score - a.score).slice(0, this.maxRankings);
        } catch (error) {
            console.error('統合ランキング取得エラー:', error);
            return this.getLocalRankings();
        }
    }

    // 重複を除去
    removeDuplicates(rankings) {
        const seen = new Set();
        return rankings.filter(ranking => {
            const key = `${ranking.name}-${ranking.score}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // 設定を更新
    updateConfig(repository, token) {
        this.repository = repository;
        this.token = token;
    }
}

// グローバルに公開
window.GitHubRanking = GitHubRanking;
