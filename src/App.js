import React, { useEffect, useRef, useState } from "react";

function App() {
  const canvasRef = useRef(null);

  const [phase, setPhase] = useState(1);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [bossHealth, setBossHealth] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);

  const keys = useRef({});
  const mouse = useRef({
    x: 0,
    y: 0,
    down: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 1200;
    canvas.height = 650;

    const player = {
      x: 100,
      y: 400,
      width: 45,
      height: 55,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 1,
      canDash: true,
      dashing: false,
      dashCooldown: false,
      invincible: false,
    };

    const gravity = 0.7;

    let cameraX = 0;
    let animationFrame;

    let currentPhase = 1;

    const bullets = [];
    const bossAttacks = [];

    let bossAttackTimer = 0;
    let bossDirection = 1;

    const levels = {
      1: {
        width: 2400,

        platforms: [
          { x: 0, y: 550, width: 700, height: 100 },
          { x: 800, y: 550, width: 600, height: 100 },
          { x: 1500, y: 550, width: 900, height: 100 },

          { x: 350, y: 450, width: 160, height: 25 },
          { x: 600, y: 380, width: 150, height: 25 },
          { x: 900, y: 440, width: 160, height: 25 },
          { x: 1150, y: 350, width: 170, height: 25 },
          { x: 1450, y: 430, width: 180, height: 25 },
          { x: 1750, y: 350, width: 170, height: 25 },
          { x: 2050, y: 420, width: 180, height: 25 },
        ],

        enemies: [
          { x: 700, y: 505, health: 2 },
          { x: 1000, y: 505, health: 2 },
          { x: 1400, y: 505, health: 3 },
          { x: 1900, y: 505, health: 3 },
        ],

        background: "forest",
      },

      2: {
        width: 2800,

        platforms: [
          { x: 0, y: 550, width: 500, height: 100 },
          { x: 650, y: 550, width: 400, height: 100 },
          { x: 1200, y: 550, width: 450, height: 100 },
          { x: 1800, y: 550, width: 500, height: 100 },
          { x: 2450, y: 550, width: 350, height: 100 },

          { x: 250, y: 420, width: 140, height: 25 },
          { x: 550, y: 320, width: 140, height: 25 },
          { x: 850, y: 400, width: 150, height: 25 },
          { x: 1100, y: 300, width: 150, height: 25 },
          { x: 1400, y: 400, width: 150, height: 25 },
          { x: 1650, y: 300, width: 150, height: 25 },
          { x: 1950, y: 400, width: 150, height: 25 },
          { x: 2200, y: 300, width: 150, height: 25 },
          { x: 2500, y: 400, width: 150, height: 25 },
        ],

        enemies: [
          { x: 650, y: 505, health: 3 },
          { x: 900, y: 505, health: 3 },
          { x: 1350, y: 505, health: 3 },
          { x: 1850, y: 505, health: 4 },
          { x: 2200, y: 505, health: 4 },
          { x: 2550, y: 505, health: 4 },
        ],

        background: "city",
      },

      3: {
        width: 1200,

        platforms: [
          { x: 0, y: 550, width: 1200, height: 100 },
          { x: 100, y: 400, width: 250, height: 25 },
          { x: 850, y: 400, width: 250, height: 25 },
        ],

        enemies: [],

        background: "boss",
      },
    };

    let enemies = [];
    let platforms = [];

    function loadPhase(number) {
      currentPhase = number;

      const level = levels[number];

      platforms = level.platforms;

      enemies = level.enemies.map((enemy) => ({
        x: enemy.x,
        y: enemy.y,
        width: 40,
        height: 45,
        health: enemy.health,
        maxHealth: enemy.health,
        alive: true,
        speed: 0.8,
      }));

      bullets.length = 0;
      bossAttacks.length = 0;

      player.x = 100;
      player.y = 400;
      player.vx = 0;
      player.vy = 0;

      player.canDash = true;
      player.dashing = false;
      player.dashCooldown = false;

      setPhase(number);

      if (number === 3) {
        setBossHealth(20);
      }
    }

    loadPhase(1);

    function keyDown(e) {
      keys.current[e.key.toLowerCase()] = true;

      if (e.code === "Space") {
        keys.current.space = true;
        e.preventDefault();
      }

      if (e.key === "Shift") {
        e.preventDefault();
      }
    }

    function keyUp(e) {
      keys.current[e.key.toLowerCase()] = false;

      if (e.code === "Space") {
        keys.current.space = false;
      }
    }

    function mouseMove(e) {
      const rect = canvas.getBoundingClientRect();

      mouse.current.x =
        (e.clientX - rect.left) *
        (canvas.width / rect.width);

      mouse.current.y =
        (e.clientY - rect.top) *
        (canvas.height / rect.height);
    }

    function mouseDown() {
      mouse.current.down = true;
    }

    function mouseUp() {
      mouse.current.down = false;
    }

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);

    function collision(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    function resetPlayer() {
      player.x = currentPhase === 3 ? 500 : 100;
      player.y = 400;

      player.vx = 0;
      player.vy = 0;

      player.dashing = false;
    }

    function damagePlayer() {
      if (player.invincible) return;

      player.invincible = true;

      setHealth((h) => {
        const newHealth = h - 1;

        if (newHealth <= 0) {
          setGameOver(true);
        }

        return newHealth;
      });

      setTimeout(() => {
        player.invincible = false;
      }, 1000);

      resetPlayer();
    }

    function controls() {
      const k = keys.current;

      if (k.a || k.arrowleft) {
        player.vx -= 0.7;
        player.facing = -1;
      }

      if (k.d || k.arrowright) {
        player.vx += 0.7;
        player.facing = 1;
      }

      if (k.space && player.grounded) {
        player.vy = -14;
        player.grounded = false;

        keys.current.space = false;
      }

      if (
        k.shift &&
        player.canDash &&
        !player.dashCooldown
      ) {
        player.vx = 18 * player.facing;

        player.canDash = false;
        player.dashing = true;
        player.dashCooldown = true;

        keys.current.shift = false;

        setTimeout(() => {
          player.dashing = false;
        }, 250);

        setTimeout(() => {
          player.canDash = true;
          player.dashCooldown = false;
        }, 800);
      }

      if (!player.dashing) {
        if (player.vx > 6) player.vx = 6;
        if (player.vx < -6) player.vx = -6;
      }
    }

    function shoot() {
      if (!mouse.current.down) return;

      if (bullets.length >= 10) return;

      const startX =
        player.x + player.width / 2;

      const startY =
        player.y + player.height / 2;

      const targetX =
        mouse.current.x + cameraX;

      const targetY =
        mouse.current.y;

      const dx = targetX - startX;
      const dy = targetY - startY;

      const distance = Math.hypot(dx, dy);

      if (!distance) return;

      bullets.push({
        x: startX,
        y: startY,

        vx: (dx / distance) * 13,
        vy: (dy / distance) * 13,

        radius: 6,
      });

      mouse.current.down = false;
    }

    function updateBullets() {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (
          bullet.x < -100 ||
          bullet.x > 3000 ||
          bullet.y < -100 ||
          bullet.y > 800
        ) {
          bullets.splice(i, 1);
          continue;
        }

        for (const enemy of enemies) {
          if (!enemy.alive) continue;

          if (
            bullet.x > enemy.x &&
            bullet.x < enemy.x + enemy.width &&
            bullet.y > enemy.y &&
            bullet.y < enemy.y + enemy.height
          ) {
            enemy.health--;

            bullets.splice(i, 1);

            if (enemy.health <= 0) {
              enemy.alive = false;

              setScore((s) => s + 5);
            }

            break;
          }
        }

        if (currentPhase === 3) {
          const boss = {
            x: 600,
            y: 220,
            width: 100,
            height: 130,
          };

          if (
            bullet.x > boss.x &&
            bullet.x < boss.x + boss.width &&
            bullet.y > boss.y &&
            bullet.y < boss.y + boss.height
          ) {
            bullets.splice(i, 1);

            setBossHealth((h) => {
              const newHealth = h - 1;

              if (newHealth <= 0) {
                setVictory(true);
              }

              return newHealth;
            });

            setScore((s) => s + 10);
          }
        }
      }
    }

    function updateEnemies() {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const distance = player.x - enemy.x;

        if (Math.abs(distance) < 350) {
          enemy.x +=
            Math.sign(distance) *
            enemy.speed;
        }

        if (
          collision(player, enemy) &&
          !player.invincible
        ) {
          damagePlayer();
        }
      }
    }

    function bossAI() {
      if (currentPhase !== 3) return;

      bossAttackTimer++;

      if (bossAttackTimer > 100) {
        bossAttackTimer = 0;

        const attackType =
          Math.floor(Math.random() * 3);

        if (attackType === 0) {
          bossAttacks.push({
            type: "horizontal",
            x: 100,
            y: 520,
            width: 1000,
            height: 25,
            vx: -7,
          });
        }

        if (attackType === 1) {
          bossAttacks.push({
            type: "falling",
            x: player.x,
            y: -30,
            width: 35,
            height: 35,
            vy: 7,
          });
        }

        if (attackType === 2) {
          bossDirection *= -1;

          bossAttacks.push({
            type: "laser",
            x: 600,
            y: 300,
            width: 500,
            height: 20,
            vx: bossDirection * 6,
          });
        }
      }

      for (let i = bossAttacks.length - 1; i >= 0; i--) {
        const attack = bossAttacks[i];

        if (attack.type === "horizontal") {
          attack.x += attack.vx;
        }

        if (attack.type === "falling") {
          attack.y += attack.vy;
        }

        if (attack.type === "laser") {
          attack.x += attack.vx;
        }

        if (
          collision(player, attack) &&
          !player.invincible
        ) {
          bossAttacks.splice(i, 1);

          damagePlayer();

          continue;
        }

        if (
          attack.x < -300 ||
          attack.x > 1500 ||
          attack.y > 700
        ) {
          bossAttacks.splice(i, 1);
        }
      }
    }

    function physics() {
      player.vy += gravity;

      player.x += player.vx;
      player.y += player.vy;

      if (!player.dashing) {
        player.vx *= 0.85;
      }

      player.grounded = false;

      for (const platform of platforms) {
        if (
          player.x <
            platform.x + platform.width &&
          player.x + player.width >
            platform.x &&
          player.y + player.height >=
            platform.y &&
          player.y + player.height <=
            platform.y + 20 &&
          player.vy >= 0
        ) {
          player.y =
            platform.y - player.height;

          player.vy = 0;

          player.grounded = true;

          player.canDash = true;
        }
      }

      if (player.y > 700) {
        damagePlayer();
      }

      if (currentPhase !== 3) {
        const level = levels[currentPhase];

        if (player.x >= level.width - 120) {
          if (currentPhase === 1) {
            loadPhase(2);
          } else if (currentPhase === 2) {
            loadPhase(3);
          }
        }
      }
    }

    function updateCamera() {
      if (currentPhase === 3) {
        cameraX = 0;
        return;
      }

      cameraX = player.x - 300;

      if (cameraX < 0) {
        cameraX = 0;
      }
    }

    function drawBackground() {
      if (currentPhase === 1) {
        const gradient =
          ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
          );

        gradient.addColorStop(
          0,
          "#9ee7ff"
        );

        gradient.addColorStop(
          1,
          "#e7fbff"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        ctx.fillStyle = "#a7d8b8";

        for (let i = 0; i < 8; i++) {
          const x =
            i * 350 -
            cameraX * 0.4;

          ctx.beginPath();

          ctx.moveTo(x, 550);
          ctx.lineTo(x + 170, 300);
          ctx.lineTo(x + 350, 550);

          ctx.fill();
        }
      }

      if (currentPhase === 2) {
        ctx.fillStyle = "#252a48";

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        for (let i = 0; i < 15; i++) {
          const x =
            i * 180 -
            cameraX * 0.3;

          const height =
            150 + (i % 4) * 70;

          ctx.fillStyle =
            "#363b62";

          ctx.fillRect(
            x,
            550 - height,
            120,
            height
          );

          ctx.fillStyle =
            "#ffe88a";

          for (
            let y = 570 - height;
            y < 540;
            y += 35
          ) {
            ctx.fillRect(
              x + 20,
              y,
              12,
              18
            );

            ctx.fillRect(
              x + 60,
              y,
              12,
              18
            );
          }
        }

        ctx.fillStyle =
          "#8e9cff";

        ctx.font = "bold 22px Arial";

        ctx.fillText(
          "NEON CITY",
          40,
          80
        );
      }

      if (currentPhase === 3) {
        ctx.fillStyle = "#17142b";

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        ctx.fillStyle = "#292344";

        for (let i = 0; i < 20; i++) {
          ctx.fillRect(
            i * 70,
            0,
            2,
            550
          );
        }

        ctx.fillStyle =
          "#ff65b5";

        ctx.beginPath();

        ctx.arc(
          600,
          160,
          90,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "#fff";

        ctx.font =
          "bold 30px Arial";

        ctx.textAlign =
          "center";

        ctx.fillText(
          "BOSS ARENA",
          600,
          70
        );

        ctx.textAlign =
          "left";
      }
    }

    function drawPlatforms() {
      for (const platform of platforms) {
        if (currentPhase === 3) {
          ctx.fillStyle =
            "#514775";
        } else if (
          currentPhase === 2
        ) {
          ctx.fillStyle =
            "#5860a0";
        } else {
          ctx.fillStyle =
            "#9bd18b";
        }

        ctx.fillRect(
          platform.x - cameraX,
          platform.y,
          platform.width,
          platform.height
        );

        ctx.fillStyle =
          currentPhase === 2
            ? "#8e9cff"
            : "#78bd69";

        ctx.fillRect(
          platform.x - cameraX,
          platform.y,
          platform.width,
          8
        );
      }
    }

    function drawEnemies() {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const x =
          enemy.x - cameraX;

        const y = enemy.y;

        ctx.fillStyle =
          currentPhase === 2
            ? "#ff65d8"
            : "#9b7cff";

        ctx.beginPath();

        ctx.roundRect(
          x,
          y,
          enemy.width,
          enemy.height,
          12
        );

        ctx.fill();

        ctx.fillStyle = "#fff";

        ctx.beginPath();

        ctx.arc(
          x + 12,
          y + 15,
          7,
          0,
          Math.PI * 2
        );

        ctx.arc(
          x + 28,
          y + 15,
          7,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "#333";

        ctx.beginPath();

        ctx.arc(
          x + 12,
          y + 15,
          3,
          0,
          Math.PI * 2
        );

        ctx.arc(
          x + 28,
          y + 15,
          3,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "#555";

        ctx.fillRect(
          x,
          y - 10,
          40,
          5
        );

        ctx.fillStyle =
          "#ff718f";

        ctx.fillRect(
          x,
          y - 10,
          40 *
            (enemy.health /
              enemy.maxHealth),
          5
        );
      }
    }

    function drawBoss() {
      if (currentPhase !== 3) return;

      const x = 600;
      const y = 220;

      /*
       * CORPO DO BOSS
       */

      ctx.fillStyle =
        "#713cff";

      ctx.beginPath();

      ctx.roundRect(
        x,
        y,
        100,
        130,
        25
      );

      ctx.fill();

      /*
       * OLHOS
       */

      ctx.fillStyle =
        "#fff";

      ctx.beginPath();

      ctx.arc(
        x + 30,
        y + 45,
        13,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 70,
        y + 45,
        13,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle =
        "#ff3b7a";

      ctx.beginPath();

      ctx.arc(
        x + 30,
        y + 45,
        6,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 70,
        y + 45,
        6,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
       * BOCA
       */

      ctx.fillStyle =
        "#21152e";

      ctx.fillRect(
        x + 25,
        y + 75,
        50,
        15
      );

      /*
       * ORELHAS
       */

      ctx.fillStyle =
        "#713cff";

      ctx.beginPath();

      ctx.moveTo(
        x + 10,
        y
      );

      ctx.lineTo(
        x - 10,
        y - 60
      );

      ctx.lineTo(
        x + 35,
        y
      );

      ctx.fill();

      ctx.beginPath();

      ctx.moveTo(
        x + 65,
        y
      );

      ctx.lineTo(
        x + 110,
        y - 60
      );

      ctx.lineTo(
        x + 90,
        y
      );

      ctx.fill();

      /*
       * CORAÇÃO
       */

      ctx.fillStyle =
        "#ff65b5";

      ctx.font =
        "30px Arial";

      ctx.fillText(
        "♥",
        x + 35,
        y + 120
      );
    }

    function drawBossAttacks() {
      for (const attack of bossAttacks) {
        if (
          attack.type ===
          "horizontal"
        ) {
          ctx.fillStyle =
            "#ff4f8b";

          ctx.fillRect(
            attack.x,
            attack.y,
            attack.width,
            attack.height
          );
        }

        if (
          attack.type ===
          "falling"
        ) {
          ctx.fillStyle =
            "#ffda55";

          ctx.beginPath();

          ctx.arc(
            attack.x,
            attack.y,
            18,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }

        if (
          attack.type ===
          "laser"
        ) {
          ctx.fillStyle =
            "rgba(255,70,180,0.7)";

          ctx.fillRect(
            attack.x,
            attack.y,
            attack.width,
            attack.height
          );
        }
      }
    }

    function drawBullets() {
      for (const bullet of bullets) {
        ctx.fillStyle =
          "#ff65b5";

        ctx.beginPath();

        ctx.arc(
          bullet.x - cameraX,
          bullet.y,
          bullet.radius,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "#fff";

        ctx.beginPath();

        ctx.arc(
          bullet.x -
            cameraX -
            2,
          bullet.y - 2,
          2,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }

    function drawDash() {
      if (!player.dashing) return;

      const x =
        player.x - cameraX;

      const y =
        player.y +
        player.height / 2;

      for (let i = 0; i < 6; i++) {
        ctx.fillStyle =
          `rgba(255,143,197,${
            0.5 - i * 0.07
          })`;

        ctx.beginPath();

        ctx.arc(
          x -
            player.facing *
              (i * 18),

          y,

          22 - i * 3,

          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }

    function drawWeapon() {
      const x =
        player.x -
        cameraX +
        (player.facing === 1
          ? 30
          : -10);

      const y =
        player.y + 27;

      ctx.save();

      ctx.translate(
        x,
        y
      );

      if (
        player.facing === -1
      ) {
        ctx.scale(-1, 1);
      }

      ctx.fillStyle =
        "#686886";

      ctx.roundRect(
        0,
        -7,
        32,
        14,
        5
      );

      ctx.fill();

      ctx.fillStyle =
        "#ff8fc5";

      ctx.roundRect(
        15,
        -5,
        12,
        10,
        3
      );

      ctx.fill();

      ctx.fillStyle =
        "#444";

      ctx.roundRect(
        5,
        5,
        9,
        14,
        3
      );

      ctx.fill();

      ctx.restore();
    }

    function drawPlayer() {
      const x =
        player.x - cameraX;

      const y =
        player.y;

      if (
        player.invincible
      ) {
        ctx.globalAlpha = 0.5;
      }

      ctx.fillStyle =
        "#fff";

      ctx.beginPath();

      ctx.roundRect(
        x,
        y + 15,
        player.width,
        40,
        15
      );

      ctx.fill();

      ctx.beginPath();

      ctx.arc(
        x + 22,
        y + 12,
        22,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle =
        "#fff";

      ctx.roundRect(
        x + 4,
        y - 25,
        12,
        35,
        8
      );

      ctx.roundRect(
        x + 29,
        y - 25,
        12,
        35,
        8
      );

      ctx.fill();

      ctx.fillStyle =
        "#ffb6cf";

      ctx.roundRect(
        x + 7,
        y - 20,
        6,
        25,
        5
      );

      ctx.roundRect(
        x + 32,
        y - 20,
        6,
        25,
        5
      );

      ctx.fill();

      ctx.fillStyle =
        "#333";

      ctx.beginPath();

      ctx.arc(
        x + 15,
        y + 10,
        3,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 30,
        y + 10,
        3,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle =
        "#ff8fb1";

      ctx.beginPath();

      ctx.arc(
        x + 22,
        y + 17,
        3,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.globalAlpha = 1;

      drawWeapon();
    }

    function drawFinish() {
      if (currentPhase === 3)
        return;

      const level =
        levels[currentPhase];

      const x =
        level.width -
        100 -
        cameraX;

      ctx.fillStyle =
        "#7d6cff";

      ctx.fillRect(
        x,
        450,
        8,
        100
      );

      ctx.fillStyle =
        "#ff9fc5";

      ctx.beginPath();

      ctx.moveTo(
        x + 8,
        450
      );

      ctx.lineTo(
        x + 70,
        475
      );

      ctx.lineTo(
        x + 8,
        500
      );

      ctx.fill();
    }

    function drawHUD() {
      ctx.fillStyle =
        "rgba(255,255,255,0.9)";

      ctx.beginPath();

      ctx.roundRect(
        20,
        20,
        250,
        55,
        20
      );

      ctx.fill();

      ctx.fillStyle =
        "#555";

      ctx.font =
        "bold 18px Arial";

      ctx.fillText(
        `❤️ ${health}`,
        40,
        53
      );

      ctx.fillText(
        `⭐ ${score}`,
        110,
        53
      );

      ctx.fillText(
        `FASE ${currentPhase}`,
        180,
        53
      );

      if (currentPhase === 3) {
        ctx.fillStyle =
          "#444";

        ctx.fillRect(
          350,
          25,
          500,
          25
        );

        ctx.fillStyle =
          "#ff4f91";

        ctx.fillRect(
          350,
          25,
          500 *
            (bossHealth /
              20),
          25
        );

        ctx.fillStyle =
          "#fff";

        ctx.font =
          "bold 16px Arial";

        ctx.textAlign =
          "center";

        ctx.fillText(
          `BOSS ${bossHealth}/20`,
          600,
          44
        );

        ctx.textAlign =
          "left";
      }
    }

    function update() {
      if (
        gameOver ||
        victory
      ) {
        return;
      }

      controls();

      shoot();

      physics();

      updateBullets();

      updateEnemies();

      bossAI();

      updateCamera();
    }

    function draw() {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      drawBackground();

      drawPlatforms();

      drawEnemies();

      drawBossAttacks();

      drawBoss();

      drawBullets();

      drawDash();

      drawFinish();

      drawPlayer();

      drawHUD();
    }

    function gameLoop() {
      update();

      draw();

      animationFrame =
        requestAnimationFrame(
          gameLoop
        );
    }

    gameLoop();

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "keydown",
        keyDown
      );

      window.removeEventListener(
        "keyup",
        keyUp
      );

      canvas.removeEventListener(
        "mousemove",
        mouseMove
      );

      canvas.removeEventListener(
        "mousedown",
        mouseDown
      );

      canvas.removeEventListener(
        "mouseup",
        mouseUp
      );
    };
  }, [gameOver, victory]);

  function restart() {
    window.location.reload();
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#dff7ff",
        fontFamily: "Arial",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "crosshair",
        }}
      />

      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform:
            "translateX(-50%)",

          background:
            "rgba(255,255,255,0.9)",

          padding:
            "12px 25px",

          borderRadius: 20,

          color: "#555",

          fontWeight: "bold",

          zIndex: 10,
        }}
      >
        A/D mover • Espaço pular •
        Shift DASH • 🖱️ Atirar
      </div>

      {gameOver && (
        <div
          style={{
            position: "fixed",
            inset: 0,

            display: "flex",

            justifyContent:
              "center",

            alignItems:
              "center",

            background:
              "rgba(20,20,40,0.7)",

            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 50,
              borderRadius: 30,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 70,
              }}
            >
              💥🐰
            </div>

            <h1>
              Você perdeu!
            </h1>

            <p>
              O Bunny precisa
              tentar novamente.
            </p>

            <button
              onClick={restart}
              style={{
                border: "none",
                padding:
                  "12px 30px",
                borderRadius: 20,
                background:
                  "#ff8fbd",
                color: "white",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {victory && (
        <div
          style={{
            position: "fixed",
            inset: 0,

            display: "flex",

            justifyContent:
              "center",

            alignItems:
              "center",

            background:
              "rgba(20,10,40,0.7)",

            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 50,
              borderRadius: 30,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 80,
              }}
            >
              🐰👑✨
            </div>

            <h1
              style={{
                color:
                  "#ff70ae",
              }}
            >
              VOCÊ VENCEU!
            </h1>

            <p>
              Você derrotou o
              chefe e completou
              todas as fases!
            </p>

            <p>
              ⭐ Pontuação:{" "}
              <b>{score}</b>
            </p>

            <button
              onClick={restart}
              style={{
                border: "none",
                padding:
                  "12px 30px",
                borderRadius: 20,
                background:
                  "#ff8fbd",
                color: "white",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
              }}
            >
              Jogar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;