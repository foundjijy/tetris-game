// JSONランキング管理クラス
class JsonRanking {
    constructor() {
        this.rankingUrl = 'ranking.json';
        this.maxRankings = 10;
    }

    // ランキングを取得
    async getRankings() {
        try {
            const response = await fetch(this.rankingUrl);
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

    // スコアを保存（GitHub Pagesでは直接書き込みできないため、ローカルストレージに保存）
    async saveScore(playerName, score) {
        try {
            const now = new Date();
            const newScore = {
                name: playerName,
                score: score,
                date: now.toLocaleString('ja-JP'),
                timestamp: now.getTime()
            };

            // ローカルストレージから現在のランキングを取得
            const localRankings = this.getLocalRankings();
            
            // 新しいスコアを追加
            localRankings.push(newScore);
            
            // スコア順でソートして上位10位まで保持
            localRankings.sort((a, b) => b.score - a.score);
            const topRankings = localRankings.slice(0, this.maxRankings);
            
            // ローカルストレージに保存
            localStorage.setItem('tetrisGlobalRankings', JSON.stringify(topRankings));
            
            console.log('スコアが保存されました:', newScore);
            return true;
        } catch (error) {
            console.error('スコア保存エラー:', error);
            return false;
        }
    }

    // ローカルストレージからランキングを取得
    getLocalRankings() {
        const saved = localStorage.getItem('tetrisGlobalRankings');
        return saved ? JSON.parse(saved) : [];
    }

    // 統合ランキングを取得（JSONファイル + ローカル）
    async getCombinedRankings() {
        try {
            // JSONファイルからランキングを取得
            const jsonRankings = await this.getRankings();
            
            // ローカルランキングを取得
            const localRankings = this.getLocalRankings();
            
            // 両方を結合して重複を除去
            const allRankings = [...jsonRankings, ...localRankings];
            const uniqueRankings = this.removeDuplicates(allRankings);
            
            // スコア順でソート
            return uniqueRankings.sort((a, b) => b.score - a.score).slice(0, this.maxRankings);
        } catch (error) {
            console.error('統合ランキング取得エラー:', error);
            return this.getLocalRankings();
        }
    }

    // 重複を除去（同じ名前とスコアの組み合わせ）
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
}

// グローバルに公開
window.JsonRanking = JsonRanking;
