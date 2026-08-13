import React, { useEffect, useRef, useState } from "react";

function App() {
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [health, setHealth] = useState(3);
  const [won, setWon] = useState(false);

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

      canDash: true,
      dashCooldown: false,
      dashing: false,

      facing: 1,

      invincible: false,
    };

    const gravity = 0.7;

    let cameraX = 0;
    let animationFrame;

    const bullets = [];

    const enemies = [
      {
        x: 700,
        y: 505,
        width: 40,
        height: 45,
        health: 2,
        alive: true,
        speed: 0.8,
      },

      {
        x: 1000,
        y: 505,
        width: 40,
        height: 45,
        health: 2,
        alive: true,
        speed: 1,
      },

      {
        x: 1400,
        y: 505,
        width: 40,
        height: 45,
        health: 3,
        alive: true,
        speed: 0.8,
      },

      {
        x: 1900,
        y: 505,
        width: 40,
        height: 45,
        health: 3,
        alive: true,
        speed: 1,
      },
    ];

    const platforms = [
      {
        x: 0,
        y: 550,
        width: 700,
        height: 100,
      },

      {
        x: 800,
        y: 550,
        width: 600,
        height: 100,
      },

      {
        x: 1500,
        y: 550,
        width: 900,
        height: 100,
      },

      {
        x: 350,
        y: 450,
        width: 160,
        height: 25,
      },

      {
        x: 600,
        y: 380,
        width: 150,
        height: 25,
      },

      {
        x: 900,
        y: 440,
        width: 160,
        height: 25,
      },

      {
        x: 1150,
        y: 350,
        width: 170,
        height: 25,
      },

      {
        x: 1450,
        y: 430,
        width: 180,
        height: 25,
      },

      {
        x: 1750,
        y: 350,
        width: 170,
        height: 25,
      },

      {
        x: 2050,
        y: 420,
        width: 180,
        height: 25,
      },
    ];

    const coins = [
      {
        x: 400,
        y: 410,
        collected: false,
      },

      {
        x: 650,
        y: 340,
        collected: false,
      },

      {
        x: 950,
        y: 400,
        collected: false,
      },

      {
        x: 1200,
        y: 310,
        collected: false,
      },

      {
        x: 1500,
        y: 390,
        collected: false,
      },

      {
        x: 1800,
        y: 310,
        collected: false,
      },

      {
        x: 2100,
        y: 380,
        collected: false,
      },
    ];

    const obstacles = [
      {
        x: 520,
        y: 510,
        width: 40,
        height: 40,
      },

      {
        x: 1100,
        y: 510,
        width: 40,
        height: 40,
      },

      {
        x: 1650,
        y: 510,
        width: 40,
        height: 40,
      },
    ];

    const finish = {
      x: 2250,
      y: 450,
      width: 40,
      height: 100,
    };

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

    window.addEventListener(
      "keydown",
      keyDown
    );

    window.addEventListener(
      "keyup",
      keyUp
    );

    canvas.addEventListener(
      "mousemove",
      mouseMove
    );

    canvas.addEventListener(
      "mousedown",
      mouseDown
    );

    canvas.addEventListener(
      "mouseup",
      mouseUp
    );

    function resetPlayer() {
      player.x = 100;
      player.y = 400;

      player.vx = 0;
      player.vy = 0;

      player.dashing = false;

      setCombo(0);
    }

    function collision(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    function controls() {
      const k = keys.current;

      /*
       * MOVIMENTO
       */

      if (k.a || k.arrowleft) {
        player.vx -= 0.7;
        player.facing = -1;
      }

      if (k.d || k.arrowright) {
        player.vx += 0.7;
        player.facing = 1;
      }

      /*
       * PULO
       */

      if (
        k.space &&
        player.grounded
      ) {
        player.vy = -14;

        player.grounded = false;

        setCombo((c) => c + 1);

        keys.current.space = false;
      }

      /*
       * DASH
       */

      if (
        k.shift &&
        player.canDash &&
        !player.dashCooldown
      ) {
        player.vx =
          18 * player.facing;

        player.canDash = false;

        player.dashing = true;

        player.dashCooldown = true;

        keys.current.shift = false;

        setCombo((c) => c + 1);

        /*
         * Duração do dash
         */

        setTimeout(() => {
          player.dashing = false;
        }, 250);

        /*
         * Recupera o dash
         */

        setTimeout(() => {
          player.canDash = true;
          player.dashCooldown = false;
        }, 800);
      }

      /*
       * LIMITA VELOCIDADE NORMAL
       */

      if (!player.dashing) {
        if (player.vx > 6) {
          player.vx = 6;
        }

        if (player.vx < -6) {
          player.vx = -6;
        }
      }
    }

    function shoot() {
      if (!mouse.current.down) {
        return;
      }

      if (bullets.length >= 8) {
        return;
      }

      const startX =
        player.x +
        player.width / 2;

      const startY =
        player.y +
        player.height / 2;

      const targetX =
        mouse.current.x +
        cameraX;

      const targetY =
        mouse.current.y;

      const dx =
        targetX - startX;

      const dy =
        targetY - startY;

      const distance =
        Math.hypot(dx, dy);

      if (distance === 0) {
        return;
      }

      bullets.push({
        x: startX,
        y: startY,

        vx:
          (dx / distance) * 12,

        vy:
          (dy / distance) * 12,

        radius: 6,
      });

      mouse.current.down = false;
    }

    function updateBullets() {
      for (
        let i = bullets.length - 1;
        i >= 0;
        i--
      ) {
        const bullet =
          bullets[i];

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
          if (!enemy.alive) {
            continue;
          }

          const hit =
            bullet.x >
              enemy.x &&
            bullet.x <
              enemy.x +
                enemy.width &&
            bullet.y >
              enemy.y &&
            bullet.y <
              enemy.y +
                enemy.height;

          if (hit) {
            enemy.health--;

            bullets.splice(i, 1);

            if (enemy.health <= 0) {
              enemy.alive = false;

              setScore(
                (s) => s + 5
              );

              setCombo(
                (c) => c + 1
              );
            }

            break;
          }
        }
      }
    }

    function updateEnemies() {
      for (const enemy of enemies) {
        if (!enemy.alive) {
          continue;
        }

        const distance =
          player.x - enemy.x;

        if (
          Math.abs(distance) < 350
        ) {
          enemy.x +=
            Math.sign(distance) *
            enemy.speed;
        }

        if (
          collision(
            player,
            enemy
          ) &&
          !player.invincible
        ) {
          player.invincible =
            true;

          setHealth((h) => {
            const newHealth =
              h - 1;

            if (newHealth <= 0) {
              resetPlayer();

              return 3;
            }

            return newHealth;
          });

          setCombo(0);

          setTimeout(() => {
            player.invincible =
              false;
          }, 1000);
        }
      }
    }

    function physics() {
      player.vy += gravity;

      player.x += player.vx;

      player.y += player.vy;

      /*
       * NÃO REDUZ A VELOCIDADE
       * DURANTE O DASH
       */

      if (!player.dashing) {
        player.vx *= 0.85;
      }

      player.grounded = false;

      for (const platform of platforms) {
        if (
          player.x <
            platform.x +
              platform.width &&
          player.x +
            player.width >
              platform.x &&
          player.y +
            player.height >=
              platform.y &&
          player.y +
            player.height <=
              platform.y +
                20 &&
          player.vy >= 0
        ) {
          player.y =
            platform.y -
            player.height;

          player.vy = 0;

          player.grounded =
            true;

          player.canDash =
            true;
        }
      }

      if (
        player.y >
        canvas.height + 100
      ) {
        resetPlayer();
      }
    }

    function collectCoins() {
      for (const coin of coins) {
        if (coin.collected) {
          continue;
        }

        const distance =
          Math.hypot(
            player.x +
              player.width / 2 -
              coin.x,

            player.y +
              player.height / 2 -
              coin.y
          );

        if (distance < 35) {
          coin.collected =
            true;

          setScore(
            (s) => s + 1
          );

          setCombo(
            (c) => c + 1
          );
        }
      }
    }

    function checkObstacles() {
      for (const obstacle of obstacles) {
        if (
          collision(
            player,
            obstacle
          )
        ) {
          resetPlayer();
        }
      }
    }

    function checkFinish() {
      if (
        collision(
          player,
          finish
        )
      ) {
        setWon(true);

        cancelAnimationFrame(
          animationFrame
        );
      }
    }

    function updateCamera() {
      cameraX =
        player.x - 300;

      if (cameraX < 0) {
        cameraX = 0;
      }
    }

    function drawBackground() {
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

      ctx.fillStyle =
        gradient;

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      /*
       * SOL
       */

      ctx.fillStyle =
        "#fff1a8";

      ctx.beginPath();

      ctx.arc(
        1000,
        100,
        45,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
       * NUVENS
       */

      ctx.fillStyle =
        "rgba(255,255,255,0.85)";

      for (
        let i = 0;
        i < 8;
        i++
      ) {
        const x =
          i * 330 -
          cameraX * 0.2;

        ctx.beginPath();

        ctx.arc(
          x,
          130,
          35,
          0,
          Math.PI * 2
        );

        ctx.arc(
          x + 40,
          120,
          45,
          0,
          Math.PI * 2
        );

        ctx.arc(
          x + 80,
          135,
          30,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      /*
       * MONTANHAS
       */

      ctx.fillStyle =
        "#a7d8b8";

      for (
        let i = 0;
        i < 8;
        i++
      ) {
        const x =
          i * 350 -
          cameraX * 0.4;

        ctx.beginPath();

        ctx.moveTo(
          x,
          550
        );

        ctx.lineTo(
          x + 170,
          300
        );

        ctx.lineTo(
          x + 350,
          550
        );

        ctx.fill();
      }
    }

    function drawPlatforms() {
      for (const platform of platforms) {
        ctx.fillStyle =
          "#9bd18b";

        ctx.fillRect(
          platform.x -
            cameraX,

          platform.y,

          platform.width,

          platform.height
        );

        ctx.fillStyle =
          "#78bd69";

        ctx.fillRect(
          platform.x -
            cameraX,

          platform.y,

          platform.width,

          8
        );
      }
    }

    function drawCoins() {
      for (const coin of coins) {
        if (coin.collected) {
          continue;
        }

        ctx.fillStyle =
          "#ffd85a";

        ctx.beginPath();

        ctx.arc(
          coin.x -
            cameraX,

          coin.y,

          12,

          0,

          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "#fff3a5";

        ctx.beginPath();

        ctx.arc(
          coin.x -
            cameraX -
            4,

          coin.y - 4,

          4,

          0,

          Math.PI * 2
        );

        ctx.fill();
      }
    }

    function drawObstacles() {
      for (const obstacle of obstacles) {
        ctx.fillStyle =
          "#ff8f9f";

        ctx.beginPath();

        ctx.moveTo(
          obstacle.x -
            cameraX,

          obstacle.y +
            obstacle.height
        );

        ctx.lineTo(
          obstacle.x -
            cameraX +
            obstacle.width /
              2,

          obstacle.y
        );

        ctx.lineTo(
          obstacle.x -
            cameraX +
            obstacle.width,

          obstacle.y +
            obstacle.height
        );

        ctx.fill();
      }
    }

    function drawEnemies() {
      for (const enemy of enemies) {
        if (!enemy.alive) {
          continue;
        }

        const x =
          enemy.x -
          cameraX;

        const y =
          enemy.y;

        /*
         * CORPO
         */

        ctx.fillStyle =
          "#9b7cff";

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
         * OLHOS
         */

        ctx.fillStyle =
          "white";

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

        /*
         * VIDA
         */

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
              3),
          5
        );
      }
    }

    function drawBullets() {
      for (const bullet of bullets) {
        ctx.fillStyle =
          "#ff65b5";

        ctx.beginPath();

        ctx.arc(
          bullet.x -
            cameraX,

          bullet.y,

          bullet.radius,

          0,

          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          "white";

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

    function drawDashEffect() {
      if (!player.dashing) {
        return;
      }

      const x =
        player.x -
        cameraX;

      const y =
        player.y +
        player.height /
          2;

      /*
       * RASTRO
       */

      for (
        let i = 0;
        i < 5;
        i++
      ) {
        ctx.fillStyle =
          `rgba(255,143,197,${
            0.5 - i * 0.08
          })`;

        ctx.beginPath();

        ctx.arc(
          x -
            player.facing *
              (i * 18),

          y,

          20 - i * 3,

          0,

          Math.PI * 2
        );

        ctx.fill();
      }

      /*
       * ESTRELAS
       */

      ctx.fillStyle =
        "#fff4a3";

      for (
        let i = 0;
        i < 5;
        i++
      ) {
        const sx =
          x -
          player.facing *
            (20 + i * 18);

        const sy =
          y +
          Math.sin(
            Date.now() / 100 +
              i
          ) *
            15;

        ctx.beginPath();

        ctx.arc(
          sx,
          sy,
          4,
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

      /*
       * BLASTER
       */

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

      /*
       * PONTA ROSA
       */

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

      /*
       * EMPUNHADURA
       */

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
        player.x -
        cameraX;

      const y =
        player.y;

      if (
        player.invincible
      ) {
        ctx.globalAlpha =
          0.5;
      }

      /*
       * CORPO
       */

      ctx.fillStyle =
        "#ffffff";

      ctx.beginPath();

      ctx.roundRect(
        x,
        y + 15,
        player.width,
        40,
        15
      );

      ctx.fill();

      /*
       * CABEÇA
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
       * ORELHAS
       */

      ctx.fillStyle =
        "#ffffff";

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
       * ORELHAS ROSAS
       */

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

      /*
       * OLHOS
       */

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

      /*
       * NARIZ
       */

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
      const x =
        finish.x -
        cameraX;

      ctx.fillStyle =
        "#7d6cff";

      ctx.fillRect(
        x,
        finish.y,
        8,
        finish.height
      );

      ctx.fillStyle =
        "#ff9fc5";

      ctx.beginPath();

      ctx.moveTo(
        x + 8,
        finish.y
      );

      ctx.lineTo(
        x + 70,
        finish.y + 25
      );

      ctx.lineTo(
        x + 8,
        finish.y + 50
      );

      ctx.fill();
    }

    function update() {
      controls();

      shoot();

      physics();

      updateBullets();

      updateEnemies();

      collectCoins();

      checkObstacles();

      checkFinish();

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

      drawCoins();

      drawObstacles();

      drawEnemies();

      drawBullets();

      drawDashEffect();

      drawFinish();

      drawPlayer();
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
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#dff7ff",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "contain",
          cursor: "crosshair",
        }}
      />

      {/* HUD */}

      <div
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform:
            "translateX(-50%)",

          display: "flex",
          gap: 25,

          padding:
            "12px 25px",

          background:
            "rgba(255,255,255,0.9)",

          borderRadius: 25,

          boxShadow:
            "0 5px 20px rgba(0,0,0,0.12)",

          color: "#555",

          fontSize: 18,

          fontWeight: "bold",

          zIndex: 10,
        }}
      >
        <span>
          ❤️ {health}
        </span>

        <span>
          ⭐ {score}
        </span>

        <span>
          🔥 {combo}
        </span>
      </div>

      {/* CONTROLES */}

      <div
        style={{
          position: "fixed",

          bottom: 20,

          left: "50%",

          transform:
            "translateX(-50%)",

          padding:
            "12px 22px",

          background:
            "rgba(255,255,255,0.9)",

          borderRadius: 20,

          color: "#555",

          boxShadow:
            "0 5px 15px rgba(0,0,0,0.1)",

          zIndex: 10,

          whiteSpace:
            "nowrap",
        }}
      >
        <b>A / D</b> mover
        &nbsp; • &nbsp;

        <b>Espaço</b> pular
        &nbsp; • &nbsp;

        <b>Shift</b> DASH
        &nbsp; • &nbsp;

        <b>🖱️ Clique</b> atirar
      </div>

      {/* VITÓRIA */}

      {won && (
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
              "rgba(180,230,245,0.65)",

            backdropFilter:
              "blur(5px)",

            zIndex: 100,
          }}
        >
          <div
            style={{
              background:
                "white",

              padding:
                "40px 60px",

              borderRadius: 30,

              textAlign:
                "center",

              boxShadow:
                "0 15px 50px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                fontSize: 70,
              }}
            >
              🐰✨
            </div>

            <h1
              style={{
                color:
                  "#ff8fbd",
              }}
            >
              Fase concluída!
            </h1>

            <p>
              O Bunny conseguiu
              chegar ao final!
            </p>

            <p>
              ⭐ Pontuação:{" "}
              <strong>
                {score}
              </strong>
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              style={{
                border: "none",

                padding:
                  "12px 25px",

                marginTop: 15,

                borderRadius: 20,

                background:
                  "#ff9fc5",

                color: "white",

                fontSize: 16,

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