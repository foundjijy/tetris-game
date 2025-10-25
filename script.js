// テトリスゲームのメインクラス
class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.isGameOver = false;
        this.gameLoop = null;
        this.dropTime = 0;
        this.dropInterval = 1000; // 1秒
        
        // BGM関連
        this.bgm = null;
        this.gameOverBgm = null;
        this.bgmVolume = 0.3; // 音量（0.0-1.0）
        this.isMuted = false;
        
        // 効果音関連
        this.sfxVolume = 0.5; // 効果音の音量（0.0-1.0）
        
        // 点数表示アニメーション
        this.scoreAnimations = [];
        
        // スコア記録関連
        this.highScores = this.loadHighScores();
        this.githubRanking = null;
        this.initGitHubRanking();
        
        this.init();
    }
    
    init() {
        this.initializeBoard();
        this.createNewPiece();
        this.createNextPiece();
        this.setupEventListeners();
        this.updateDisplay();
        this.initializeBGM();
    }
    
    initializeBoard() {
        this.board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                this.board[y][x] = 0;
            }
        }
    }
    
    // テトリミノの形状定義
    getTetrominoShapes() {
        return {
            'I': [
                [0,0,0,0],
                [1,1,1,1],
                [0,0,0,0],
                [0,0,0,0]
            ],
            'O': [
                [1,1],
                [1,1]
            ],
            'T': [
                [0,1,0],
                [1,1,1],
                [0,0,0]
            ],
            'S': [
                [0,1,1],
                [1,1,0],
                [0,0,0]
            ],
            'Z': [
                [1,1,0],
                [0,1,1],
                [0,0,0]
            ],
            'J': [
                [1,0,0],
                [1,1,1],
                [0,0,0]
            ],
            'L': [
                [0,0,1],
                [1,1,1],
                [0,0,0]
            ]
        };
    }
    
    // テトリミノの色定義
    getTetrominoColors() {
        return {
            'I': '#00f5ff',
            'O': '#ffff00',
            'T': '#a000f0',
            'S': '#00f000',
            'Z': '#f00000',
            'J': '#0000f0',
            'L': '#ff7f00'
        };
    }
    
    createNewPiece() {
        const shapes = this.getTetrominoShapes();
        const colors = this.getTetrominoColors();
        const types = Object.keys(shapes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        this.currentPiece = {
            shape: shapes[randomType],
            color: colors[randomType],
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(shapes[randomType][0].length / 2),
            y: 0,
            type: randomType
        };
    }
    
    createNextPiece() {
        const shapes = this.getTetrominoShapes();
        const colors = this.getTetrominoColors();
        const types = Object.keys(shapes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        this.nextPiece = {
            shape: shapes[randomType],
            color: colors[randomType],
            type: randomType
        };
        
        this.drawNextPiece();
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(
                            offsetX + x * blockSize,
                            offsetY + y * blockSize,
                            blockSize - 1,
                            blockSize - 1
                        );
                    }
                }
            }
        }
    }
    
    // テトリミノの回転
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = [];
        const shape = this.currentPiece.shape;
        const size = shape.length;
        
        for (let i = 0; i < size; i++) {
            rotated[i] = [];
            for (let j = 0; j < size; j++) {
                rotated[i][j] = shape[size - 1 - j][i];
            }
        }
        
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
    }
    
    // 衝突判定
    checkCollision() {
        if (!this.currentPiece) return false;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT || 
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // テトリミノを固定
    placePiece() {
        if (!this.currentPiece) return;
        
        // 着地効果音を再生
        this.playLandingSound();
        
        // 現在のピースをボードに固定
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // ライン消去処理
        this.clearLines();
        
        // 次のピースを現在のピースに設定
        if (this.nextPiece) {
            this.currentPiece = {
                shape: [...this.nextPiece.shape],
                color: this.nextPiece.color,
                type: this.nextPiece.type,
                x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
                y: 0
            };
        } else {
            // nextPieceがない場合は新しく作成
            this.createNewPiece();
        }
        
        // 新しい次のピースを作成
        this.createNextPiece();
        
        // 新しいピースが衝突するかチェック（ゲームオーバー判定）
        if (this.checkCollision()) {
            this.gameOver();
        }
    }
    
    // ライン消去
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // 同じ行を再チェック
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // 新しいスコア計算システム
            let baseScore = 0;
            switch(linesCleared) {
                case 1:
                    baseScore = 100;
                    break;
                case 2:
                    baseScore = 300;
                    break;
                case 3:
                    baseScore = 600;
                    break;
                case 4:
                    baseScore = 1200;
                    break;
                default:
                    baseScore = linesCleared * 100;
            }
            
            // レベル倍率を適用
            const finalScore = baseScore * this.level;
            this.score += finalScore;
            
            // 点数表示アニメーションを追加
            this.addScoreAnimation(finalScore, linesCleared);
            
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateDisplay();
        }
    }
    
    // 描画
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // ボードの描画
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            }
        }
        
        // 現在のテトリミノの描画
        if (this.currentPiece) {
            this.ctx.fillStyle = this.currentPiece.color;
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.ctx.fillRect(
                            (this.currentPiece.x + x) * this.BLOCK_SIZE,
                            (this.currentPiece.y + y) * this.BLOCK_SIZE,
                            this.BLOCK_SIZE - 1,
                            this.BLOCK_SIZE - 1
                        );
                    }
                }
            }
        }
        
        // 点数表示アニメーションの描画
        this.drawScoreAnimations();
    }
    
    // ゲームループ
    gameStep(timestamp) {
        if (!this.gameRunning) return;
        
        if (timestamp - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = timestamp;
        }
        
        // 点数表示アニメーションの更新
        this.updateScoreAnimations();
        
        this.draw();
        this.gameLoop = requestAnimationFrame((ts) => this.gameStep(ts));
    }
    
    // テトリミノの移動
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                // テトリミノが頂上（y座標が0未満）にある場合はゲームオーバー
                if (this.currentPiece.y < 0) {
                    this.gameOver();
                    return;
                }
                this.placePiece();
            }
        }
    }
    
    // 一気に落下
    dropPiece() {
        while (!this.checkCollision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        
        // テトリミノが頂上（y座標が0未満）にある場合はゲームオーバー
        if (this.currentPiece.y < 0) {
            this.gameOver();
            return;
        }
        
        this.placePiece();
    }
    
    // ゲーム開始
    startGame() {
        this.gameRunning = true;
        this.isGameOver = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.initializeBoard();
        this.createNewPiece();
        this.createNextPiece();
        this.updateDisplay();
        this.hideGameOver();
        this.hidePauseOverlay();
        this.stopGameOverBGM(); // ゲームオーバー用BGMを停止
        this.playBGM(); // 通常BGMを再生
        this.gameLoop = requestAnimationFrame((ts) => this.gameStep(ts));
    }
    
    // ゲーム停止
    stopGame() {
        this.gameRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }
    
    // 一時停止
    pauseGame() {
        this.stopGame();
        if (this.bgm) {
            this.bgm.pause();
        }
        if (this.gameOverBgm) {
            this.gameOverBgm.pause();
        }
        this.showPauseOverlay();
    }
    
    // 一時停止表示
    showPauseOverlay() {
        document.getElementById('pause-overlay').style.display = 'block';
    }
    
    // 一時停止非表示
    hidePauseOverlay() {
        document.getElementById('pause-overlay').style.display = 'none';
    }
    
    // ゲームオーバー
    gameOver() {
        this.isGameOver = true;
        this.stopGame();
        this.stopBGM(); // 通常BGMを停止
        this.playGameOverBGM(); // ゲームオーバー用BGMを再生
        this.showGameOver();
        
        // スコア記録モーダルを表示
        setTimeout(() => {
            this.showScoreModal();
        }, 1000);
    }
    
    // 表示更新
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    // ゲームオーバー表示
    showGameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').style.display = 'block';
    }
    
    // ゲームオーバー非表示
    hideGameOver() {
        document.getElementById('game-over').style.display = 'none';
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // ランキング表示ボタン
        document.getElementById('show-ranking-btn').addEventListener('click', () => {
            this.showRanking();
        });
        
        // スコア保存ボタン
        document.getElementById('save-score-btn').addEventListener('click', () => {
            this.saveScore();
        });
        
        // スコア保存スキップボタン
        document.getElementById('skip-save-btn').addEventListener('click', () => {
            this.hideScoreModal();
        });
        
        // ランキング閉じるボタン
        document.getElementById('close-ranking-btn').addEventListener('click', () => {
            this.hideRanking();
        });
        
        // GitHub設定ボタン
        document.getElementById('setup-github-btn').addEventListener('click', () => {
            this.showGitHubModal();
        });
        
        // GitHub設定保存ボタン
        document.getElementById('save-github-btn').addEventListener('click', () => {
            this.saveGitHubConfig();
        });
        
        // GitHub設定閉じるボタン
        document.getElementById('close-github-btn').addEventListener('click', () => {
            this.hideGitHubModal();
        });
        
        // 操作方法表示ボタン（長押しで表示）
        let showControlsTimer = null;
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.game-board')) {
                showControlsTimer = setTimeout(() => {
                    this.showControls();
                }, 1000); // 1秒長押し
            }
        });
        
        document.addEventListener('touchend', () => {
            if (showControlsTimer) {
                clearTimeout(showControlsTimer);
                showControlsTimer = null;
            }
        });
        
        // 操作方法閉じるボタン
        document.getElementById('close-controls-btn').addEventListener('click', () => {
            this.hideControls();
        });
        
        // Enterキーでスコア保存
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveScore();
            }
        });
        
        // タッチ操作コントロール
        this.setupTouchControls();
    }
    
    // 一時停止切り替え
    togglePause() {
        if (this.gameRunning) {
            this.pauseGame();
        } else {
            this.resumeGame();
        }
    }
    
    // ゲーム再開
    resumeGame() {
        this.gameRunning = true;
        this.hidePauseOverlay();
        // ゲームオーバー中でなければ通常BGMを再開
        if (!this.isGameOver) {
            this.playBGM();
        } else {
            this.playGameOverBGM();
        }
        this.gameLoop = requestAnimationFrame((ts) => this.gameStep(ts));
    }
    
    // BGM初期化
    initializeBGM() {
        this.bgm = new Audio('sounds/bgm.mp3');
        this.bgm.loop = true;
        this.bgm.volume = this.bgmVolume;
        
        // ゲームオーバー用BGM初期化
        this.gameOverBgm = new Audio('sounds/gameover.mp3');
        this.gameOverBgm.loop = true;
        this.gameOverBgm.volume = this.bgmVolume;
        
        // ユーザーの最初の操作でBGMを開始（ブラウザの自動再生ポリシー対応）
        const startBGM = () => {
            if (this.bgm && !this.isMuted) {
                this.bgm.play().catch(e => console.log('BGM再生エラー:', e));
            }
            document.removeEventListener('click', startBGM);
            document.removeEventListener('keydown', startBGM);
        };
        
        document.addEventListener('click', startBGM);
        document.addEventListener('keydown', startBGM);
    }
    
    // BGM再生
    playBGM() {
        if (this.bgm && !this.isMuted) {
            this.bgm.play().catch(e => console.log('BGM再生エラー:', e));
        }
    }
    
    // BGM停止
    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
    }
    
    // ゲームオーバー用BGM再生
    playGameOverBGM() {
        if (this.gameOverBgm && !this.isMuted) {
            this.gameOverBgm.play().catch(e => console.log('ゲームオーバーBGM再生エラー:', e));
        }
    }
    
    // ゲームオーバー用BGM停止
    stopGameOverBGM() {
        if (this.gameOverBgm) {
            this.gameOverBgm.pause();
            this.gameOverBgm.currentTime = 0;
        }
    }
    
    // BGMミュート切り替え
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgm) {
            this.bgm.muted = this.isMuted;
        }
        if (this.gameOverBgm) {
            this.gameOverBgm.muted = this.isMuted;
        }
        this.updateMuteButton();
    }
    
    // 音量調整
    setVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgm) {
            this.bgm.volume = this.bgmVolume;
        }
        if (this.gameOverBgm) {
            this.gameOverBgm.volume = this.bgmVolume;
        }
    }
    
    // 着地効果音再生
    playLandingSound() {
        if (!this.isMuted) {
            // 新しい音声インスタンスを作成して重複再生を可能にする
            const sound = new Audio('sounds/landing.mp3');
            sound.volume = this.sfxVolume;
            sound.play().catch(e => console.log('効果音再生エラー:', e));
        }
    }
    
    // ミュートボタン更新
    updateMuteButton() {
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.textContent = this.isMuted ? '🔊' : '🔇';
        }
    }
    
    // 点数表示アニメーションを追加
    addScoreAnimation(score, linesCleared) {
        const animation = {
            score: score,
            lines: linesCleared,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            alpha: 1.0,
            scale: 1.0,
            life: 60, // 60フレーム（約1秒）
            maxLife: 60
        };
        this.scoreAnimations.push(animation);
    }
    
    // 点数表示アニメーションの更新
    updateScoreAnimations() {
        for (let i = this.scoreAnimations.length - 1; i >= 0; i--) {
            const anim = this.scoreAnimations[i];
            anim.life--;
            anim.y -= 2; // 上に移動
            anim.alpha = anim.life / anim.maxLife;
            anim.scale = 1.0 + (1.0 - anim.alpha) * 0.5; // 少し拡大
            
            if (anim.life <= 0) {
                this.scoreAnimations.splice(i, 1);
            }
        }
    }
    
    // 点数表示アニメーションの描画
    drawScoreAnimations() {
        this.ctx.save();
        
        for (const anim of this.scoreAnimations) {
            this.ctx.globalAlpha = anim.alpha;
            this.ctx.font = `bold ${24 * anim.scale}px Arial`;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            
            // 点数テキスト
            const scoreText = `+${anim.score}`;
            const linesText = anim.lines === 4 ? 'TETRIS!' : 
                             anim.lines === 3 ? 'TRIPLE!' : 
                             anim.lines === 2 ? 'DOUBLE!' : 'SINGLE';
            
            // 中央揃えで描画
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 点数を描画
            this.ctx.strokeText(scoreText, anim.x, anim.y - 10);
            this.ctx.fillText(scoreText, anim.x, anim.y - 10);
            
            // ライン数を描画
            this.ctx.font = `bold ${16 * anim.scale}px Arial`;
            this.ctx.strokeText(linesText, anim.x, anim.y + 15);
            this.ctx.fillText(linesText, anim.x, anim.y + 15);
        }
        
        this.ctx.restore();
    }
    
    // ハイスコア読み込み
    loadHighScores() {
        const saved = localStorage.getItem('tetrisHighScores');
        return saved ? JSON.parse(saved) : [];
    }
    
    // ハイスコア保存
    saveHighScores() {
        localStorage.setItem('tetrisHighScores', JSON.stringify(this.highScores));
    }
    
    // スコア記録モーダル表示
    showScoreModal() {
        document.getElementById('modal-score').textContent = this.score;
        document.getElementById('score-modal').style.display = 'flex';
        document.getElementById('player-name').focus();
    }
    
    // スコア記録モーダル非表示
    hideScoreModal() {
        document.getElementById('score-modal').style.display = 'none';
    }
    
    // ランキング表示
    showRanking() {
        document.getElementById('ranking-modal').style.display = 'flex';
        this.updateRankingDisplay();
    }
    
    // ランキング非表示
    hideRanking() {
        document.getElementById('ranking-modal').style.display = 'none';
    }
    
    // スコア保存処理
    async saveScore() {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('プレイヤー名を入力してください');
            return;
        }
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const newScore = {
            name: playerName,
            score: this.score,
            date: dateStr,
            timestamp: now.getTime()
        };
        
        // ローカルランキングにも保存
        this.highScores.push(newScore);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);
        this.saveHighScores();
        
        // GitHubランキングにも保存
        if (this.githubRanking) {
            try {
                await this.githubRanking.saveScore(playerName, this.score);
                console.log('GitHubランキングにスコアを保存しました');
            } catch (error) {
                console.error('GitHubランキング保存エラー:', error);
            }
        }
        
        this.hideScoreModal();
        this.showRanking();
    }
    
    // GitHubランキング初期化
    initGitHubRanking() {
        try {
            if (window.GitHubRanking) {
                this.githubRanking = new window.GitHubRanking();
                console.log('GitHubランキング初期化完了');
            } else {
                console.log('GitHubランキング設定ファイルが見つかりません');
            }
        } catch (error) {
            console.error('GitHubランキング初期化エラー:', error);
        }
    }

    // ランキング表示更新
    async updateRankingDisplay() {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '<p>読み込み中...</p>';
        
        try {
            let rankings = [];
            
            // GitHubランキングから取得
            if (this.githubRanking) {
                rankings = await this.githubRanking.getCombinedRankings();
            }
            
            // JSONランキングから取得できない場合はローカルランキングを使用
            if (rankings.length === 0) {
                rankings = this.highScores;
            }
            
            rankingList.innerHTML = '';
            
            if (rankings.length === 0) {
                rankingList.innerHTML = '<p>まだ記録がありません</p>';
                return;
            }
            
            rankings.forEach((score, index) => {
                const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
                const rankNumber = index + 1;
                
                const rankingItem = document.createElement('div');
                rankingItem.className = `ranking-item ${rankClass}`;
                rankingItem.innerHTML = `
                    <div class="ranking-info">
                        <div class="ranking-name">${rankNumber}位. ${score.name}</div>
                        <div class="ranking-date">${score.date || score.timestamp?.toLocaleString('ja-JP')}</div>
                    </div>
                    <div class="ranking-score">${score.score.toLocaleString()}点</div>
                `;
                rankingList.appendChild(rankingItem);
            });
        } catch (error) {
            console.error('ランキング表示エラー:', error);
            rankingList.innerHTML = '<p>ランキングの読み込みに失敗しました</p>';
        }
    }
    
    // タッチ操作のセットアップ
    setupTouchControls() {
        // タッチボタンのイベントリスナー
        document.getElementById('move-left').addEventListener('click', () => {
            if (this.gameRunning) {
                this.movePiece(-1, 0);
            }
        });
        
        document.getElementById('move-right').addEventListener('click', () => {
            if (this.gameRunning) {
                this.movePiece(1, 0);
            }
        });
        
        document.getElementById('rotate-btn').addEventListener('click', () => {
            if (this.gameRunning) {
                this.rotatePiece();
            }
        });
        
        document.getElementById('soft-drop').addEventListener('click', () => {
            if (this.gameRunning) {
                this.movePiece(0, 1);
            }
        });
        
        document.getElementById('hard-drop').addEventListener('click', () => {
            if (this.gameRunning) {
                this.dropPiece();
            }
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            if (!this.isGameOver) {
                this.togglePause();
            }
        });
        
        // スワイプジェスチャーの設定
        this.setupSwipeGestures();
    }
    
    // スワイプジェスチャーの設定
    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        
        // タッチ開始
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: false });
        
        // タッチ終了
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;
            
            const touch = e.changedTouches[0];
            endX = touch.clientX;
            endY = touch.clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const minSwipeDistance = 30; // 最小スワイプ距離
            
            // 水平スワイプ
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.movePiece(1, 0); // 右スワイプ
                } else {
                    this.movePiece(-1, 0); // 左スワイプ
                }
            }
            // 垂直スワイプ
            else if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    this.movePiece(0, 1); // 下スワイプ（高速落下）
                } else {
                    this.rotatePiece(); // 上スワイプ（回転）
                }
            }
            // タップ（短いタッチ）
            else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                this.rotatePiece(); // タップで回転
            }
        }, { passive: false });
        
        // 長押し検出（一気に落下）
        let longPressTimer = null;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            longPressTimer = setTimeout(() => {
                if (this.gameRunning) {
                    this.dropPiece();
                }
            }, 500); // 500ms長押し
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    // GitHub設定モーダル表示
    showGitHubModal() {
        document.getElementById('github-modal').style.display = 'flex';
        // 保存された設定を読み込み
        const savedRepo = localStorage.getItem('githubRepo');
        const savedToken = localStorage.getItem('githubToken');
        if (savedRepo) document.getElementById('github-repo').value = savedRepo;
        if (savedToken) document.getElementById('github-token').value = savedToken;
    }
    
    // GitHub設定モーダル非表示
    hideGitHubModal() {
        document.getElementById('github-modal').style.display = 'none';
    }
    
    // GitHub設定保存
    saveGitHubConfig() {
        const repo = document.getElementById('github-repo').value.trim();
        const token = document.getElementById('github-token').value.trim();
        
        if (!repo || !token) {
            alert('リポジトリ名とトークンを入力してください');
            return;
        }
        
        // ローカルストレージに保存
        localStorage.setItem('githubRepo', repo);
        localStorage.setItem('githubToken', token);
        
        // GitHubランキングクラスに設定を適用
        if (this.githubRanking) {
            this.githubRanking.updateConfig(repo, token);
        }
        
        alert('GitHub設定が保存されました！');
        this.hideGitHubModal();
    }
    
    // 操作方法表示
    showControls() {
        document.getElementById('off-screen-controls').style.display = 'flex';
    }
    
    // 操作方法非表示
    hideControls() {
        document.getElementById('off-screen-controls').style.display = 'none';
    }
}

// ゲーム初期化
const game = new Tetris();
game.startGame();
