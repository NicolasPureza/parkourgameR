import React, { useEffect, useRef, useState } from "react";

function App() {
  const canvasRef = useRef(null);

  const [phase, setPhase] = useState(1);
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [bossHP, setBossHP] = useState(30);
  const [victory, setVictory] = useState(false);
  const [dead, setDead] = useState(false);

  const game = useRef({
    phase: 1,
    health: 3,
    score: 0,
    bossHP: 30,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 1200;
    canvas.height = 650;

    const keys = {};

    const player = {
      x: 100,
      y: 480,
      width: 45,
      height: 55,

      vx: 0,
      vy: 0,

      grounded: false,

      facing: 1,

      dashing: false,
      canDash: true,
      dashTimer: 0,

      invincible: false,
      invincibleTimer: 0,
    };

    let cameraX = 0;

    let bullets = [];
    let enemies = [];
    let attacks = [];

    let bossAttackTimer = 0;
    let shootCooldown = 0;

    /*
    =====================================================
    FASES
    =====================================================
    */

    const levels = {
      1: {
        width: 2800,

        platforms: [
          { x: 0, y: 550, w: 700, h: 100 },
          { x: 850, y: 550, w: 500, h: 100 },
          { x: 1500, y: 550, w: 600, h: 100 },
          { x: 2250, y: 550, w: 550, h: 100 },

          { x: 300, y: 440, w: 180, h: 25 },
          { x: 600, y: 350, w: 170, h: 25 },
          { x: 900, y: 420, w: 170, h: 25 },
          { x: 1150, y: 320, w: 180, h: 25 },
          { x: 1450, y: 420, w: 180, h: 25 },
          { x: 1750, y: 330, w: 180, h: 25 },
          { x: 2050, y: 410, w: 170, h: 25 },
          { x: 2350, y: 320, w: 180, h: 25 },
        ],

        enemies: [
          { x: 700, y: 505, hp: 3 },
          { x: 1000, y: 505, hp: 3 },
          { x: 1550, y: 505, hp: 4 },
          { x: 1900, y: 505, hp: 4 },
          { x: 2400, y: 505, hp: 4 },
        ],
      },

      2: {
        width: 3200,

        platforms: [
          { x: 0, y: 550, w: 500, h: 100 },
          { x: 650, y: 550, w: 450, h: 100 },
          { x: 1250, y: 550, w: 400, h: 100 },
          { x: 1800, y: 550, w: 450, h: 100 },
          { x: 2400, y: 550, w: 800, h: 100 },

          { x: 200, y: 400, w: 150, h: 25 },
          { x: 500, y: 300, w: 160, h: 25 },
          { x: 800, y: 410, w: 150, h: 25 },
          { x: 1050, y: 300, w: 160, h: 25 },
          { x: 1350, y: 400, w: 150, h: 25 },
          { x: 1600, y: 290, w: 170, h: 25 },
          { x: 1900, y: 400, w: 160, h: 25 },
          { x: 2150, y: 300, w: 170, h: 25 },
          { x: 2500, y: 400, w: 170, h: 25 },
          { x: 2800, y: 290, w: 170, h: 25 },
        ],

        enemies: [
          { x: 650, y: 505, hp: 4 },
          { x: 900, y: 505, hp: 4 },
          { x: 1300, y: 505, hp: 5 },
          { x: 1850, y: 505, hp: 5 },
          { x: 2450, y: 505, hp: 5 },
          { x: 2850, y: 505, hp: 5 },
        ],
      },

      3: {
        width: 1200,

        platforms: [
          { x: 0, y: 550, w: 1200, h: 100 },
          { x: 100, y: 400, w: 220, h: 25 },
          { x: 880, y: 400, w: 220, h: 25 },
        ],

        enemies: [],
      },
    };

    /*
    =====================================================
    CARREGAR FASE
    =====================================================
    */

    function loadPhase(number) {
      game.current.phase = number;

      setPhase(number);

      player.x = number === 3 ? 150 : 100;
      player.y = 450;

      player.vx = 0;
      player.vy = 0;

      player.canDash = true;
      player.dashing = false;

      bullets = [];
      attacks = [];

      enemies = levels[number].enemies.map((enemy) => ({
        x: enemy.x,
        y: enemy.y,
        width: 40,
        height: 45,
        hp: enemy.hp,
        maxHp: enemy.hp,
        alive: true,
      }));

      if (number === 3) {
        game.current.bossHP = 30;
        setBossHP(30);
      }
    }

    loadPhase(1);

    /*
    =====================================================
    TECLADO
    =====================================================
    */

    function keyDown(e) {
      keys[e.key.toLowerCase()] = true;

      if (e.code === "Space") {
        keys.space = true;
        e.preventDefault();
      }

      if (e.key === "Shift") {
        keys.shift = true;
        e.preventDefault();
      }
    }

    function keyUp(e) {
      keys[e.key.toLowerCase()] = false;

      if (e.code === "Space") {
        keys.space = false;
      }

      if (e.key === "Shift") {
        keys.shift = false;
      }
    }

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    /*
    =====================================================
    MOUSE
    =====================================================
    */

    let mouseX = 600;
    let mouseY = 300;
    let mouseDown = false;

    function mouseMove(e) {
      const rect = canvas.getBoundingClientRect();

      mouseX =
        (e.clientX - rect.left) *
        (canvas.width / rect.width);

      mouseY =
        (e.clientY - rect.top) *
        (canvas.height / rect.height);
    }

    function mouseDownEvent() {
      mouseDown = true;
    }

    function mouseUpEvent() {
      mouseDown = false;
    }

    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("mousedown", mouseDownEvent);
    canvas.addEventListener("mouseup", mouseUpEvent);

    /*
    =====================================================
    COLISÃO
    =====================================================
    */

    function collision(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    /*
    =====================================================
    DANO
    =====================================================
    */

    function damagePlayer() {
      if (player.invincible) return;

      game.current.health -= 1;

      setHealth(game.current.health);

      player.invincible = true;
      player.invincibleTimer = 60;

      player.vx = 0;
      player.vy = -8;

      if (game.current.health <= 0) {
        setDead(true);
      }
    }

    /*
    =====================================================
    CONTROLES
    =====================================================
    */

    function updateControls() {
      if (keys.a || keys.arrowleft) {
        player.vx -= 0.7;
        player.facing = -1;
      }

      if (keys.d || keys.arrowright) {
        player.vx += 0.7;
        player.facing = 1;
      }

      /*
      PULO
      */

      if (keys.space && player.grounded) {
        player.vy = -14;

        player.grounded = false;

        keys.space = false;
      }

      /*
      DASH
      */

      if (
        keys.shift &&
        player.canDash &&
        !player.dashing
      ) {
        player.dashing = true;

        player.canDash = false;

        player.dashTimer = 15;

        player.vx = player.facing * 18;

        keys.shift = false;
      }

      /*
      VELOCIDADE
      */

      if (!player.dashing) {
        if (player.vx > 6) player.vx = 6;
        if (player.vx < -6) player.vx = -6;

        player.vx *= 0.86;
      }

      /*
      FIM DO DASH
      */

      if (player.dashing) {
        player.dashTimer--;

        if (player.dashTimer <= 0) {
          player.dashing = false;
        }
      }
    }

    /*
    =====================================================
    FÍSICA
    =====================================================
    */

    function updatePhysics() {
      player.vy += 0.7;

      player.x += player.vx;
      player.y += player.vy;

      player.grounded = false;

      const platforms = levels[game.current.phase].platforms;

      for (const platform of platforms) {
        const p = {
          x: platform.x,
          y: platform.y,
          width: platform.w,
          height: platform.h,
        };

        if (
          player.x < p.x + p.width &&
          player.x + player.width > p.x &&
          player.y + player.height >= p.y &&
          player.y + player.height <= p.y + 20 &&
          player.vy >= 0
        ) {
          player.y = p.y - player.height;

          player.vy = 0;

          player.grounded = true;

          player.canDash = true;
        }
      }

      /*
      CAIU
      */

      if (player.y > 700) {
        damagePlayer();

        player.x = game.current.phase === 3 ? 150 : 100;
        player.y = 400;
        player.vy = 0;
      }

      /*
      PRÓXIMA FASE
      */

      if (game.current.phase !== 3) {
        if (
          player.x >
          levels[game.current.phase].width - 100
        ) {
          loadPhase(game.current.phase + 1);
        }
      }

      /*
      INVENCIBILIDADE
      */

      if (player.invincible) {
        player.invincibleTimer--;

        if (player.invincibleTimer <= 0) {
          player.invincible = false;
        }
      }
    }

    /*
    =====================================================
    TIRO
    =====================================================
    */

    function shoot() {
      if (!mouseDown) return;

      if (shootCooldown > 0) return;

      shootCooldown = 10;

      const startX =
        player.x + player.width / 2;

      const startY =
        player.y + player.height / 2;

      const targetX = mouseX + cameraX;
      const targetY = mouseY;

      const dx = targetX - startX;
      const dy = targetY - startY;

      const distance = Math.hypot(dx, dy);

      if (distance === 0) return;

      bullets.push({
        x: startX,
        y: startY,

        vx: (dx / distance) * 14,
        vy: (dy / distance) * 14,

        radius: 6,
      });
    }

    /*
    =====================================================
    BALAS
    =====================================================
    */

    function updateBullets() {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        /*
        INIMIGOS
        */

        for (const enemy of enemies) {
          if (!enemy.alive) continue;

          if (
            bullet.x > enemy.x &&
            bullet.x < enemy.x + enemy.width &&
            bullet.y > enemy.y &&
            bullet.y < enemy.y + enemy.height
          ) {
            enemy.hp--;

            bullets.splice(i, 1);

            if (enemy.hp <= 0) {
              enemy.alive = false;

              game.current.score += 10;

              setScore(game.current.score);
            }

            break;
          }
        }

        /*
        BOSS
        */

        if (game.current.phase === 3) {
          const boss = {
            x: 550,
            y: 200,
            width: 100,
            height: 150,
          };

          if (
            bullet.x > boss.x &&
            bullet.x < boss.x + boss.width &&
            bullet.y > boss.y &&
            bullet.y < boss.y + boss.height
          ) {
            bullets.splice(i, 1);

            game.current.bossHP--;

            setBossHP(game.current.bossHP);

            game.current.score += 5;

            setScore(game.current.score);

            if (game.current.bossHP <= 0) {
              setVictory(true);
            }
          }
        }

        /*
        REMOVE BALAS
        */

        if (
          bullet.x < -200 ||
          bullet.x > 3000 ||
          bullet.y < -200 ||
          bullet.y > 800
        ) {
          bullets.splice(i, 1);
        }
      }
    }

    /*
    =====================================================
    INIMIGOS
    =====================================================
    */

    function updateEnemies() {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const distance = player.x - enemy.x;

        if (Math.abs(distance) < 350) {
          enemy.x += Math.sign(distance) * 0.8;
        }

        if (
          collision(player, {
            x: enemy.x,
            y: enemy.y,
            width: enemy.width,
            height: enemy.height,
          })
        ) {
          damagePlayer();
        }
      }
    }

    /*
    =====================================================
    BOSS
    =====================================================
    */

    function updateBoss() {
      if (game.current.phase !== 3) return;

      bossAttackTimer++;

      /*
      A CADA POUCO TEMPO
      O BOSS USA UM ATAQUE
      */

      if (bossAttackTimer > 90) {
        bossAttackTimer = 0;

        const attack =
          Math.floor(Math.random() * 3);

        /*
        ATAQUE 1
        ONDA NO CHÃO
        */

        if (attack === 0) {
          attacks.push({
            type: "wave",

            x: 0,

            y: 520,

            width: 180,

            height: 30,

            vx: 8,
          });
        }

        /*
        ATAQUE 2
        BOLAS CAINDO
        */

        if (attack === 1) {
          for (let i = 0; i < 5; i++) {
            attacks.push({
              type: "fall",

              x: 100 + i * 250,

              y: -30,

              width: 30,

              height: 30,

              vy: 7,
            });
          }
        }

        /*
        ATAQUE 3
        LASER
        */

        if (attack === 2) {
          attacks.push({
            type: "laser",

            x: 600,

            y: 100,

            width: 25,

            height: 450,

            life: 60,
          });
        }
      }

      /*
      ATUALIZA ATAQUES
      */

      for (let i = attacks.length - 1; i >= 0; i--) {
        const attack = attacks[i];

        if (attack.type === "wave") {
          attack.x += attack.vx;
        }

        if (attack.type === "fall") {
          attack.y += attack.vy;
        }

        if (attack.type === "laser") {
          attack.life--;
        }

        const hitbox = {
          x: attack.x,
          y: attack.y,
          width: attack.width,
          height: attack.height,
        };

        if (collision(player, hitbox)) {
          damagePlayer();

          attacks.splice(i, 1);

          continue;
        }

        if (
          attack.x > 1400 ||
          attack.y > 700 ||
          attack.life <= 0
        ) {
          attacks.splice(i, 1);
        }
      }
    }

    /*
    =====================================================
    CÂMERA
    =====================================================
    */

    function updateCamera() {
      if (game.current.phase === 3) {
        cameraX = 0;
      } else {
        cameraX = player.x - 300;

        if (cameraX < 0) {
          cameraX = 0;
        }
      }
    }

    /*
    =====================================================
    DESENHO DO FUNDO
    =====================================================
    */

    function drawBackground() {
      /*
      FASE 1
      */

      if (game.current.phase === 1) {
        ctx.fillStyle = "#a7e8fa";

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        /*
        SOL
        */

        ctx.fillStyle = "#ffe994";

        ctx.beginPath();

        ctx.arc(
          1000,
          130,
          60,
          0,
          Math.PI * 2
        );

        ctx.fill();

        /*
        NUVENS
        */

        ctx.fillStyle = "#f5fbff";

        for (let i = 0; i < 8; i++) {
          const x =
            i * 300 -
            cameraX * 0.2;

          ctx.beginPath();

          ctx.arc(
            x,
            150,
            45,
            0,
            Math.PI * 2
          );

          ctx.arc(
            x + 45,
            135,
            55,
            0,
            Math.PI * 2
          );

          ctx.arc(
            x + 90,
            150,
            40,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }

        /*
        MONTANHAS
        */

        ctx.fillStyle = "#a5d6b5";

        for (let i = 0; i < 10; i++) {
          const x =
            i * 350 -
            cameraX * 0.35;

          ctx.beginPath();

          ctx.moveTo(x, 550);

          ctx.lineTo(
            x + 170,
            350
          );

          ctx.lineTo(
            x + 350,
            550
          );

          ctx.fill();
        }
      }

      /*
      FASE 2
      */

      if (game.current.phase === 2) {
        ctx.fillStyle = "#22243f";

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        /*
        LUA
        */

        ctx.fillStyle = "#fff1a8";

        ctx.beginPath();

        ctx.arc(
          950,
          110,
          55,
          0,
          Math.PI * 2
        );

        ctx.fill();

        /*
        PRÉDIOS
        */

        for (let i = 0; i < 20; i++) {
          const x =
            i * 180 -
            cameraX * 0.4;

          const height =
            150 +
            (i % 4) * 70;

          ctx.fillStyle = "#34385c";

          ctx.fillRect(
            x,
            550 - height,
            130,
            height
          );

          /*
          JANELAS
          */

          ctx.fillStyle = "#ffe783";

          for (
            let y = 550 - height + 30;
            y < 530;
            y += 45
          ) {
            ctx.fillRect(
              x + 25,
              y,
              15,
              20
            );

            ctx.fillRect(
              x + 75,
              y,
              15,
              20
            );
          }
        }

        ctx.fillStyle = "#ff75d1";

        ctx.font = "bold 30px Arial";

        ctx.fillText(
          "NEON CITY",
          40,
          100
        );
      }

      /*
      FASE 3
      */

      if (game.current.phase === 3) {
        ctx.fillStyle = "#17142c";

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        /*
        CÍRCULOS NO FUNDO
        */

        ctx.strokeStyle = "#382c5c";

        ctx.lineWidth = 3;

        for (let i = 0; i < 12; i++) {
          ctx.beginPath();

          ctx.arc(
            600,
            320,
            100 + i * 40,
            0,
            Math.PI * 2
          );

          ctx.stroke();
        }

        ctx.fillStyle = "#ff65b5";

        ctx.font = "bold 30px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
          "BOSS ARENA",
          600,
          70
        );

        ctx.textAlign = "left";
      }
    }

    /*
    =====================================================
    PLATAFORMAS
    =====================================================
    */

    function drawPlatforms() {
      const platforms =
        levels[game.current.phase]
          .platforms;

      for (const p of platforms) {
        if (game.current.phase === 1) {
          ctx.fillStyle = "#98d183";
        }

        if (game.current.phase === 2) {
          ctx.fillStyle = "#6069a8";
        }

        if (game.current.phase === 3) {
          ctx.fillStyle = "#594d7c";
        }

        ctx.fillRect(
          p.x - cameraX,
          p.y,
          p.w,
          p.h
        );

        /*
        PARTE DE CIMA
        */

        if (game.current.phase === 1) {
          ctx.fillStyle = "#71b966";
        } else {
          ctx.fillStyle = "#8f98ff";
        }

        ctx.fillRect(
          p.x - cameraX,
          p.y,
          p.w,
          8
        );
      }
    }

    /*
    =====================================================
    INIMIGOS
    =====================================================
    */

    function drawEnemies() {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const x =
          enemy.x - cameraX;

        const y = enemy.y;

        ctx.fillStyle =
          game.current.phase === 2
            ? "#e76cff"
            : "#9674ee";

        ctx.beginPath();

        ctx.roundRect(
          x,
          y,
          enemy.width,
          enemy.height,
          12
        );

        ctx.fill();

        /*
        OLHOS
        */

        ctx.fillStyle = "#fff";

        ctx.beginPath();

        ctx.arc(
          x + 12,
          y + 16,
          8,
          0,
          Math.PI * 2
        );

        ctx.arc(
          x + 28,
          y + 16,
          8,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#333";

        ctx.beginPath();

        ctx.arc(
          x + 12,
          y + 16,
          3,
          0,
          Math.PI * 2
        );

        ctx.arc(
          x + 28,
          y + 16,
          3,
          0,
          Math.PI * 2
        );

        ctx.fill();

        /*
        VIDA
        */

        ctx.fillStyle = "#444";

        ctx.fillRect(
          x,
          y - 10,
          40,
          5
        );

        ctx.fillStyle = "#ff6f96";

        ctx.fillRect(
          x,
          y - 10,
          40 *
            (enemy.hp /
              enemy.maxHp),
          5
        );
      }
    }

    /*
    =====================================================
    BOSS
    =====================================================
    */

    function drawBoss() {
      if (game.current.phase !== 3)
        return;

      const x = 550;
      const y = 200;

      /*
      SOMBRA
      */

      ctx.fillStyle =
        "rgba(0,0,0,0.2)";

      ctx.beginPath();

      ctx.ellipse(
        600,
        365,
        90,
        20,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
      CORPO
      */

      ctx.fillStyle = "#713cff";

      ctx.beginPath();

      ctx.roundRect(
        x,
        y,
        100,
        150,
        25
      );

      ctx.fill();

      /*
      ORELHAS
      */

      ctx.fillStyle = "#713cff";

      ctx.beginPath();

      ctx.moveTo(
        x + 10,
        y + 20
      );

      ctx.lineTo(
        x - 20,
        y - 70
      );

      ctx.lineTo(
        x + 40,
        y
      );

      ctx.fill();

      ctx.beginPath();

      ctx.moveTo(
        x + 60,
        y
      );

      ctx.lineTo(
        x + 120,
        y - 70
      );

      ctx.lineTo(
        x + 90,
        y + 20
      );

      ctx.fill();

      /*
      OLHOS
      */

      ctx.fillStyle = "#fff";

      ctx.beginPath();

      ctx.arc(
        x + 30,
        y + 55,
        15,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 70,
        y + 55,
        15,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle = "#ff3c7f";

      ctx.beginPath();

      ctx.arc(
        x + 30,
        y + 55,
        7,
        0,
        Math.PI * 2
      );

      ctx.arc(
        x + 70,
        y + 55,
        7,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
      BOCA
      */

      ctx.fillStyle = "#28172f";

      ctx.roundRect(
        x + 25,
        y + 85,
        50,
        20,
        8
      );

      ctx.fill();

      ctx.fillStyle = "#ff65b5";

      ctx.font = "30px Arial";

      ctx.fillText(
        "♥",
        x + 36,
        y + 135
      );
    }

    /*
    =====================================================
    ATAQUES DO BOSS
    =====================================================
    */

    function drawBossAttacks() {
      for (const attack of attacks) {
        if (attack.type === "wave") {
          ctx.fillStyle = "#ff4f91";

          ctx.beginPath();

          ctx.roundRect(
            attack.x,
            attack.y,
            attack.width,
            attack.height,
            10
          );

          ctx.fill();
        }

        if (attack.type === "fall") {
          ctx.fillStyle = "#ffd84d";

          ctx.beginPath();

          ctx.arc(
            attack.x + 15,
            attack.y + 15,
            15,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }

        if (attack.type === "laser") {
          ctx.fillStyle =
            "rgba(255,70,180,0.75)";

          ctx.fillRect(
            attack.x,
            attack.y,
            attack.width,
            attack.height
          );

          ctx.fillStyle = "#fff";

          ctx.fillRect(
            attack.x + 8,
            attack.y,
            5,
            attack.height
          );
        }
      }
    }

    /*
    =====================================================
    BALAS
    =====================================================
    */

    function drawBullets() {
      for (const bullet of bullets) {
        ctx.fillStyle = "#ff65b5";

        ctx.beginPath();

        ctx.arc(
          bullet.x - cameraX,
          bullet.y,
          bullet.radius,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#fff";

        ctx.beginPath();

        ctx.arc(
          bullet.x - cameraX - 2,
          bullet.y - 2,
          2,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }

    /*
    =====================================================
    PLAYER
    =====================================================
    */

    function drawPlayer() {
      const x =
        player.x - cameraX;

      const y = player.y;

      if (player.invincible) {
        ctx.globalAlpha = 0.45;
      }

      /*
      CORPO
      */

      ctx.fillStyle = "#fff";

      ctx.beginPath();

      ctx.roundRect(
        x,
        y + 15,
        45,
        40,
        15
      );

      ctx.fill();

      /*
      CABEÇA
      */

      ctx.beginPath();

      ctx.arc(
        x + 22,
        y + 12,
        22,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
      ORELHAS
      */

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

      /*
      INTERIOR DAS ORELHAS
      */

      ctx.fillStyle = "#ffb6cf";

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

      /*
      OLHOS
      */

      ctx.fillStyle = "#333";

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

      /*
      NARIZ
      */

      ctx.fillStyle = "#ff8fb1";

      ctx.beginPath();

      ctx.arc(
        x + 22,
        y + 17,
        3,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
      ARMA
      */

      ctx.save();

      ctx.translate(
        x +
          (player.facing === 1
            ? 30
            : -5),
        y + 30
      );

      if (player.facing === -1) {
        ctx.scale(-1, 1);
      }

      ctx.fillStyle = "#55556d";

      ctx.roundRect(
        0,
        -7,
        35,
        14,
        5
      );

      ctx.fill();

      ctx.fillStyle = "#ff8fc5";

      ctx.roundRect(
        18,
        -5,
        13,
        10,
        3
      );

      ctx.fill();

      ctx.fillStyle = "#3b3b4d";

      ctx.roundRect(
        7,
        5,
        10,
        15,
        3
      );

      ctx.fill();

      ctx.restore();

      ctx.globalAlpha = 1;

      /*
      DASH
      */

      if (player.dashing) {
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle =
            `rgba(255,140,200,${
              0.5 - i * 0.07
            })`;

          ctx.beginPath();

          ctx.arc(
            x -
              player.facing *
                (i * 18),
            y + 30,
            20 - i * 3,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }
      }
    }

    /*
    =====================================================
    HUD
    =====================================================
    */

    function drawHUD() {
      ctx.fillStyle =
        "rgba(255,255,255,0.92)";

      ctx.beginPath();

      ctx.roundRect(
        460,
        25,
        280,
        65,
        35
      );

      ctx.fill();

      ctx.fillStyle = "#555";

      ctx.font =
        "bold 20px Arial";

      ctx.fillText(
        `❤️ ${game.current.health}`,
        490,
        65
      );

      ctx.fillText(
        `⭐ ${game.current.score}`,
        570,
        65
      );

      ctx.fillText(
        `🔥 ${game.current.phase}`,
        660,
        65
      );

      /*
      BARRA DO BOSS
      */

      if (game.current.phase === 3) {
        ctx.fillStyle = "#444";

        ctx.fillRect(
          350,
          110,
          500,
          25
        );

        ctx.fillStyle = "#ff4f91";

        ctx.fillRect(
          350,
          110,
          500 *
            (game.current.bossHP / 30),
          25
        );

        ctx.fillStyle = "#fff";

        ctx.font =
          "bold 15px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
          `BOSS ${game.current.bossHP}/30`,
          600,
          128
        );

        ctx.textAlign = "left";
      }
    }

    /*
    =====================================================
    FINAL DA FASE
    =====================================================
    */

    function drawFinish() {
      if (game.current.phase === 3)
        return;

      const x =
        levels[game.current.phase].width -
        100 -
        cameraX;

      ctx.fillStyle = "#735dff";

      ctx.fillRect(
        x,
        450,
        8,
        100
      );

      ctx.fillStyle = "#ff9fc5";

      ctx.beginPath();

      ctx.moveTo(
        x + 8,
        450
      );

      ctx.lineTo(
        x + 75,
        475
      );

      ctx.lineTo(
        x + 8,
        500
      );

      ctx.fill();
    }

    /*
    =====================================================
    LOOP
    =====================================================
    */

    function update() {
      if (dead || victory) return;

      if (shootCooldown > 0) {
        shootCooldown--;
      }

      updateControls();

      updatePhysics();

      shoot();

      updateBullets();

      updateEnemies();

      updateBoss();

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

      drawFinish();

      drawEnemies();

      drawBoss();

      drawBossAttacks();

      drawBullets();

      drawPlayer();

      drawHUD();
    }

    function loop() {
      update();

      draw();

      requestAnimationFrame(loop);
    }

    loop();

    return () => {
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
        mouseDownEvent
      );

      canvas.removeEventListener(
        "mouseup",
        mouseUpEvent
      );
    };
  }, [dead, victory]);

  function restart() {
    window.location.reload();
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#a7e8fa",
        fontFamily: "Arial, sans-serif",
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
          bottom: 25,
          left: "50%",
          transform: "translateX(-50%)",

          background:
            "rgba(255,255,255,0.92)",

          padding:
            "15px 30px",

          borderRadius: "30px",

          boxShadow:
            "0 5px 20px rgba(0,0,0,0.12)",

          color: "#555",

          fontSize: "18px",

          zIndex: 10,
        }}
      >
        <b>A / D</b> mover
        {" • "}
        <b>Espaço</b> pular
        {" • "}
        <b>Shift</b> DASH
        {" • "}
        🖱️ <b>Clique</b> atirar
      </div>

      {dead && (
        <div
          style={{
            position: "fixed",
            inset: 0,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            background:
              "rgba(20,20,40,0.7)",

            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "45px 60px",
              borderRadius: "30px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "70px",
              }}
            >
              💥🐰
            </div>

            <h1>
              Você perdeu!
            </h1>

            <button
              onClick={restart}
              style={{
                border: "none",
                padding: "14px 30px",
                borderRadius: "25px",

                background:
                  "#ff8fbd",

                color: "#fff",

                fontWeight: "bold",

                fontSize: "16px",

                cursor: "pointer",
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
            alignItems: "center",
            justifyContent: "center",

            background:
              "rgba(20,10,40,0.75)",

            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "45px 60px",
              borderRadius: "30px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "80px",
              }}
            >
              🐰👑✨
            </div>

            <h1
              style={{
                color: "#ff70ae",
              }}
            >
              VOCÊ VENCEU!
            </h1>

            <p>
              Você derrotou o
              chefe e terminou
              as três fases!
            </p>

            <h2>
              ⭐ {score} pontos
            </h2>

            <button
              onClick={restart}
              style={{
                border: "none",
                padding: "14px 30px",
                borderRadius: "25px",

                background:
                  "#ff8fbd",

                color: "#fff",

                fontWeight: "bold",

                fontSize: "16px",

                cursor: "pointer",
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