const fs = require('fs');
const path = require('path');

// ランキング更新スクリプト
async function updateRanking() {
    try {
        const rankingPath = path.join(__dirname, '..', 'ranking.json');
        
        // 現在のランキングを読み込み
        let rankings = [];
        if (fs.existsSync(rankingPath)) {
            const data = fs.readFileSync(rankingPath, 'utf8');
            rankings = JSON.parse(data);
        }
        
        // 新しいスコアデータを取得（GitHub APIから）
        const newScoreData = process.env.NEW_SCORE_DATA;
        if (newScoreData) {
            const newScore = JSON.parse(newScoreData);
            rankings.push(newScore);
        }
        
        // スコア順でソートして上位10位まで保持
        rankings.sort((a, b) => b.score - a.score);
        rankings = rankings.slice(0, 10);
        
        // 重複を除去（同じ名前とスコアの組み合わせ）
        const uniqueRankings = [];
        const seen = new Set();
        
        for (const ranking of rankings) {
            const key = `${ranking.name}-${ranking.score}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueRankings.push(ranking);
            }
        }
        
        // ランキングファイルを更新
        fs.writeFileSync(rankingPath, JSON.stringify(uniqueRankings, null, 2));
        
        console.log('ランキングが更新されました:', uniqueRankings.length, '件');
        
    } catch (error) {
        console.error('ランキング更新エラー:', error);
        process.exit(1);
    }
}

updateRanking();
