window.addEventListener("load", () => {
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 500;

    class InputHandler {
        constructor(game) {
            this.game = game;
            window.addEventListener("keydown", (e) => {
                if (
                    (e.key === "ArrowUp" || e.key === "ArrowDown") &&
                    !this.game.keys.includes(e.key)
                ) {
                    this.game.keys.push(e.key);
                } else if (e.key === " ") {
                    this.game.player.shootTop();
                } else if (e.key === "d") {
                    this.game.debug = !this.game.debug;
                }
            });
            window.addEventListener("keyup", (e) => {
                if (this.game.keys.includes(e.key)) {
                    this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }
            });
        }
    }
    class Projectile {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 28;
            this.height = 10;
            this.speed = 3;
            this.markedForDeletion = false;
            this.image = projectileImg;
        }
        update() {
            this.x += this.speed;
            if (this.x + this.width > this.game.width)
                this.markedForDeletion = true;
        }
        draw(ctx) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
    class Particle {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.image = gearImg;
            this.frameX = Math.floor(Math.random() * 3);
            this.frameY = Math.floor(Math.random() * 3);
            this.spriteSize = 50;
            this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
            this.size = this.spriteSize * this.sizeModifier;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * -15;
            this.gravity = 0.5;
            this.markedForDeletion = false;
            this.angle = 0;
            this.va = Math.random() * 0.2 - 0.1;
            this.bounced = 0;
            this.bottomBounceBoundary = Math.random() * 80 + 60;
        }
        update() {
            this.angle += this.va;
            this.speedY += this.gravity;
            this.x -= this.speedX + this.game.speed;
            this.y += this.speedY;
            if (this.y + this.size > this.game.height || this.x + this.size < 0)
                this.markedForDeletion = true;
            if (
                this.y > this.game.height - this.bottomBounceBoundary &&
                this.bounced < 5
            ) {
                this.speedY *= -0.7;
                this.bounced++;
            }
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(
                this.image,
                this.frameX * this.spriteSize,
                this.frameY * this.spriteSize,
                this.spriteSize,
                this.spriteSize,
                0 - this.size * 0.5,
                0 - this.size * 0.5,
                this.size,
                this.size
            );
            ctx.restore();
        }
    }
    class Explosion {
        constructor(game, x, y) {
            this.game = game;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 8;
            this.spriteWidth = 200;
            this.spriteHeight = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = x - this.width / 2;
            this.y = y - this.height / 2;
            this.fps = 15;
            this.frameInterval = 1000 / this.fps;
            this.frameTimer = 0;

            this.markedForDeletion = false;
        }
        update(deltaTime) {
            this.x -= this.game.speed;
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX < this.maxFrame) {
                    this.frameX++;
                } else this.markedForDeletion = true;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
        }
        draw(ctx) {
            ctx.drawImage(
                this.image,
                this.frameX * this.spriteWidth,
                this.frameY * this.spriteHeight,
                this.spriteWidth,
                this.spriteHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }
    }
    class smokeExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = smokeExplosionImg;
        }
    }
    class FireExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = fireExplosionImg;
        }
    }
    class Player {
        constructor(game) {
            this.game = game;
            this.width = 120;
            this.height = 190;
            this.x = 20;
            this.y = 100;
            this.speedX = 0;
            this.speedY = 0;
            this.maxSpeed = 2;
            this.projectiles = [];
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
            this.image = playerImg;
            this.powerUp = false;
            this.powerUpLimit = 10000;
            this.powerUpTimer = 0;
        }
        update(deltaTime) {
            if (this.game.keys.includes("ArrowUp"))
                this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes("ArrowDown"))
                this.speedY = this.maxSpeed;
            else this.speedY = 0;
            this.x += this.speedX;
            this.y += this.speedY;
            //vertical boundaries
            if (this.y + this.height * 0.5 > this.game.height)
                this.y = this.game.height - this.height * 0.5;
            else if (this.y + this.height * 0.5 < 0)
                this.y = -this.height * 0.5;

            //handle projectiles
            this.projectiles.forEach((projectile, index) => {
                projectile.update();
                if (projectile.markedForDeletion) {
                    setTimeout(() => this.projectiles.splice(index, 1), 0);
                }
            });
            // sprite animation
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;
            //power up
            if (this.powerUp) {
                this.frameY = 1;
                if (this.powerUpTimer > this.powerUpLimit) {
                    this.powerUp = false;
                    this.powerUpTimer = 0;
                    this.frameY = 0;
                } else {
                    this.powerUpTimer += deltaTime;
                    this.game.ammo += 0.1;
                }
            }
        }
        draw(ctx) {
            if (this.game.debug) {
                ctx.fillStyle = "black";
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                ctx.stroke();
            }
            this.projectiles.forEach((projectile) => {
                projectile.draw(ctx);
            });
            ctx.drawImage(
                this.image,
                this.frameX * this.width,
                this.frameY * this.height,
                this.width,
                this.height,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }
        shootTop() {
            if (this.game.ammo > 0) {
                this.projectiles.push(
                    new Projectile(
                        this.game,
                        this.x + this.width - 30,
                        this.y + this.height / 6
                    )
                );
                this.game.ammo--;
            }
            if (this.powerUp) this.shootBottom();
        }
        shootBottom() {
            if (this.game.ammo > 0) {
                this.projectiles.push(
                    new Projectile(
                        this.game,
                        this.x + this.width - 20,
                        this.y + this.height * 0.9
                    )
                );
            }
        }
        enterPowerUp() {
            this.powerUp = true;
            if (this.game.ammo < this.game.maxAmmo)
                this.game.ammo = this.game.maxAmmo;
        }
    }
    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markedForDeletion = false;
            this.frameX = 0;
            this.maxFrame = 37;
        }
        update() {
            this.x += this.speedX - this.game.speed;
            if (this.x + this.width < 0) this.markedForDeletion = true;
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;
        }
        draw(ctx) {
            ctx.save();
            if (this.game.debug) {
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                ctx.stroke();
                ctx.font = "20px Helvetica";
                ctx.fillText(this.lives, this.x, this.y);
            }
            ctx.drawImage(
                this.image,
                this.frameX * this.width,
                this.frameY * this.height,
                this.width,
                this.height,
                this.x,
                this.y,
                this.width,
                this.height
            );
            ctx.restore();
        }
    }
    class Angler1 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 228;
            this.height = 169;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = angler1Img;
            this.frameY = Math.floor(Math.random() * 3);
            this.lives = 2;
            this.score = this.lives;
        }
    }
    class Angler2 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 213;
            this.height = 165;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = angler2Img;
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 3;
            this.score = this.lives;
        }
    }
    class LuckyFish extends Enemy {
        constructor(game) {
            super(game);
            this.width = 99;
            this.height = 95;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = luckyImg;
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 3;
            this.score = 15;
            this.type = "lucky";
        }
    }
    class HiveWhale extends Enemy {
        constructor(game) {
            super(game);
            this.width = 400;
            this.height = 227;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = hiveWhaleImg;
            this.frameY = 0;
            this.lives = 15;
            this.score = this.lives;
            this.type = "hive";
            this.speedX = Math.random() * -1.2 - 0.2;
        }
    }
    class Drone extends Enemy {
        constructor(game, x, y) {
            super(game);
            this.width = 115;
            this.height = 95;
            this.x = x;
            this.y = y;
            this.image = droneImg;
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 3;
            this.score = this.lives;
            this.type = "drone";
            this.speedX = Math.random() * -4.2 - 0.5;
        }
    }

    class Layer {
        constructor(game, image, speedModifier) {
            this.game = game;
            this.image = image;
            this.width = 1768;
            this.height = 500;
            this.speedModifier = speedModifier;
            this.x = 0;
            this.y = 0;
        }
        update() {
            if (this.x < -this.width) this.x = 0;
            else this.x -= this.game.speed * this.speedModifier;
        }
        draw(ctx) {
            ctx.drawImage(this.image, this.x, this.y);
            ctx.drawImage(this.image, this.x + this.width, this.y);
        }
    }
    class Background {
        constructor(game) {
            this.game = game;
            this.layer1 = new Layer(this.game, layer1Img, 0.3);
            this.layer2 = new Layer(this.game, layer2Img, 0.6);
            this.layer3 = new Layer(this.game, layer3Img, 1);
            this.layer4 = new Layer(this.game, layer4Img, 1.2);
            this.layers = [this.layer1, this.layer2, this.layer3];
        }
        update() {
            this.layers.forEach((layer) => layer.update());
        }
        draw(ctx) {
            this.layers.forEach((layer) => layer.draw(ctx));
        }
    }
    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = "Bangers";
            this.color = "white";
        }
        draw(ctx) {
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.shadowOffSetX = 2;
            ctx.shadowOffSetY = 2;
            ctx.shadowColor = "black";
            ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            ctx.fillText(`Score: ${this.game.score}`, 20, 40);
            //timer
            const formattedTime = (this.game.gameTimer / 1000).toFixed(2);
            ctx.fillText(`Timer: ${formattedTime}`, 20, 100);
            //game over message
            if (this.game.gameOver) {
                ctx.textAlign = "center";
                let message1;
                let message2;
                if (this.game.checkWin()) {
                    message1 = "You win!";
                    message2 = "Well done";
                } else {
                    message1 = "You lose!";
                    message2 = "Try again next time!";
                }
                ctx.font = `50px ${this.fontFamily}`;
                ctx.fillText(
                    message1,
                    this.game.width * 0.5,
                    this.game.height * 0.5 - 30
                );
                ctx.font = `25px ${this.fontFamily}`;
                ctx.fillText(
                    message2,
                    this.game.width * 0.5,
                    this.game.height * 0.5 + 30
                );
            }
            //ammo
            if (this.game.player.powerUp) ctx.fillStyle = "#ffffbd";
            for (let i = 0; i < this.game.ammo; i++) {
                ctx.fillRect(20 + 5 * i, 50, 3, 20);
            }
            ctx.restore();
        }
    }
    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.keys = [];
            this.background = new Background(this);
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.UI = new UI(this);
            this.ammo = 20;
            this.ammoTimer = 0;
            this.maxAmmo = 50;
            this.ammoInterval = 500;
            this.enemies = [];
            this.enemyInterval = 1000;
            this.enemyTimer = 0;
            this.gameOver = false;
            this.score = 0;
            this.winningScore = 1000;
            this.gameTimer = 0;
            this.timeLimit = 1000000;
            this.speed = 1;
            this.debug = false;
            this.particles = [];
            this.explosions = [];
        }
        update(deltaTime) {
            if (!this.gameOver) this.gameTimer += deltaTime;
            if (this.gameTimer > this.timeLimit) this.gameOver = true;
            this.background.update();
            this.background.layer4.update();
            this.player.update(deltaTime);
            this.particles.forEach((particle) => particle.update());
            this.explosions.forEach((explosion, index) => {
                explosion.update(deltaTime);
                if (explosion.markedForDeletion) {
                    setTimeout(() => this.explosions.splice(index, 1), 0);
                }
            });
            if (this.ammoTimer > this.ammoInterval) {
                if (this.ammo < this.maxAmmo) this.ammo++;
                this.ammoTimer = 0;
            } else this.ammoTimer += deltaTime;
            this.enemies.forEach((enemy, index) => {
                enemy.update();
                if (this.checkCollision(enemy, this.player)) {
                    enemy.markedForDeletion = true;
                    for (let i = 0; i < enemy.score; i++) {
                        this.particles.push(
                            new Particle(
                                this,
                                enemy.x + enemy.width / 2,
                                enemy.y + enemy.height / 2
                            )
                        );
                    }
                    if (enemy.type === "lucky") this.player.enterPowerUp();
                    else if (!this.gameOver) this.score--;
                }
                this.player.projectiles.forEach((projectile) => {
                    if (this.checkCollision(projectile, enemy)) {
                        enemy.lives--;
                        projectile.markedForDeletion = true;
                        this.particles.push(
                            new Particle(
                                this,
                                enemy.x + enemy.width / 2,
                                enemy.y + enemy.height / 2
                            )
                        );
                        if (enemy.lives === 0) {
                            enemy.markedForDeletion = true;
                            for (let i = 0; i < enemy.score; i++) {
                                this.particles.push(
                                    new Particle(
                                        this,
                                        enemy.x + enemy.width / 2,
                                        enemy.y + enemy.height / 2
                                    )
                                );
                            }
                            this.addExplosion(enemy);
                            if (enemy.type === "hive") {
                                for (let i = 0; i < 5; i++) {
                                    const x =
                                        enemy.x + Math.random() * enemy.width;
                                    const y =
                                        enemy.y + Math.random() * enemy.height;
                                    this.enemies.push(new Drone(this, x, y));
                                }
                            }
                            if (!this.gameOver) this.score += enemy.score;
                            if (this.checkWin()) this.gameOver = true;
                        }
                    }
                });
                if (enemy.markedForDeletion) {
                    setTimeout(() => this.enemies.splice(index, 1), 0);
                }
            });
            if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else this.enemyTimer += deltaTime;
        }
        draw(ctx) {
            this.background.draw(ctx);
            this.UI.draw(ctx);
            this.player.draw(ctx);
            this.enemies.forEach((enemy) => enemy.draw(ctx));
            this.particles.forEach((particle) => particle.draw(ctx));
            this.explosions.forEach((explosion) => explosion.draw(ctx));
            this.background.layer4.draw(ctx);
        }
        addEnemy() {
            const randomize = Math.random();
            if (randomize < 0.3) this.enemies.push(new Angler1(this));
            else if (randomize < 0.6) this.enemies.push(new Angler2(this));
            else if (randomize < 0.8) this.enemies.push(new LuckyFish(this));
            else this.enemies.push(new HiveWhale(this));
        }
        addExplosion(enemy) {
            const randomize = Math.random();
            if (randomize < 0.5)
                this.explosions.push(
                    new smokeExplosion(
                        this,
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2
                    )
                );
            else
                this.explosions.push(
                    new FireExplosion(
                        this,
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2
                    )
                );
            console.log(this.explosions);
        }
        checkCollision(rect1, rect2) {
            return (
                rect1.x + rect1.width > rect2.x &&
                rect1.x < rect2.x + rect2.width &&
                rect1.y + rect1.height > rect2.y &&
                rect1.y < rect2.y + rect2.height
            );
        }
        checkWin() {
            return this.score >= this.winningScore;
        }
    }
    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.draw(ctx);
        game.update(deltaTime);
        requestAnimationFrame(animate);
    }
    animate(0);
});
