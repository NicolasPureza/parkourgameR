import React, { useEffect, useRef, useState } from "react";

function App() {
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [won, setWon] = useState(false);

  const keys = useRef({});

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
    };

    const gravity = 0.7;
    let cameraX = 0;
    let animationFrame;

    const platforms = [
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
    ];

    const coins = [
      { x: 400, y: 410, collected: false },
      { x: 650, y: 340, collected: false },
      { x: 950, y: 400, collected: false },
      { x: 1200, y: 310, collected: false },
      { x: 1500, y: 390, collected: false },
      { x: 1800, y: 310, collected: false },
      { x: 2100, y: 380, collected: false },
    ];

    const obstacles = [
      { x: 520, y: 510, width: 40, height: 40 },
      { x: 1050, y: 510, width: 40, height: 40 },
      { x: 1650, y: 510, width: 40, height: 40 },
    ];

    const finish = {
      x: 2200,
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
    }

    function keyUp(e) {
      keys.current[e.key.toLowerCase()] = false;

      if (e.code === "Space") {
        keys.current.space = false;
      }
    }

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    function resetPlayer() {
      player.x = 100;
      player.y = 400;
      player.vx = 0;
      player.vy = 0;
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

      if (k.a || k.arrowleft) {
        player.vx -= 0.7;
      }

      if (k.d || k.arrowright) {
        player.vx += 0.7;
      }

      if (k.space && player.grounded) {
        player.vy = -14;
        player.grounded = false;

        setCombo((c) => c + 1);

        keys.current.space = false;
      }

      if (
        k.shift &&
        player.canDash &&
        !player.dashCooldown
      ) {
        const direction =
          k.a || k.arrowleft ? -1 : 1;

        player.vx = 18 * direction;

        player.canDash = false;
        player.dashCooldown = true;

        keys.current.shift = false;

        setTimeout(() => {
          player.canDash = true;
        }, 800);

        setTimeout(() => {
          player.dashCooldown = false;
        }, 300);
      }

      if (player.vx > 6) {
        player.vx = 6;
      }

      if (player.vx < -6) {
        player.vx = -6;
      }
    }

    function physics() {
      player.vy += gravity;

      player.x += player.vx;
      player.y += player.vy;

      player.vx *= 0.85;

      player.grounded = false;

      for (const platform of platforms) {
        if (
          player.x < platform.x + platform.width &&
          player.x + player.width > platform.x &&
          player.y + player.height >= platform.y &&
          player.y + player.height <= platform.y + 20 &&
          player.vy >= 0
        ) {
          player.y = platform.y - player.height;
          player.vy = 0;

          player.grounded = true;
          player.canDash = true;
        }
      }

      if (player.y > canvas.height + 100) {
        resetPlayer();
        setCombo(0);
      }
    }

    function collectCoins() {
      for (const coin of coins) {
        if (coin.collected) continue;

        const distance = Math.hypot(
          player.x + player.width / 2 - coin.x,
          player.y + player.height / 2 - coin.y
        );

        if (distance < 35) {
          coin.collected = true;

          setScore((s) => s + 1);
          setCombo((c) => c + 1);
        }
      }
    }

    function checkObstacles() {
      for (const obstacle of obstacles) {
        if (collision(player, obstacle)) {
          resetPlayer();
          setCombo(0);
        }
      }
    }

    function checkFinish() {
      if (collision(player, finish)) {
        setWon(true);
        cancelAnimationFrame(animationFrame);
      }
    }

    function updateCamera() {
      cameraX = player.x - 300;

      if (cameraX < 0) {
        cameraX = 0;
      }
    }

    function drawBackground() {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
      );

      gradient.addColorStop(0, "#9ee7ff");
      gradient.addColorStop(1, "#e7fbff");

      ctx.fillStyle = gradient;

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Nuvens
      ctx.fillStyle = "rgba(255,255,255,0.85)";

      for (let i = 0; i < 8; i++) {
        const x = i * 330 - cameraX * 0.2;

        ctx.beginPath();

        ctx.arc(x, 130, 35, 0, Math.PI * 2);
        ctx.arc(x + 40, 120, 45, 0, Math.PI * 2);
        ctx.arc(x + 80, 135, 30, 0, Math.PI * 2);

        ctx.fill();
      }

      // Montanhas
      ctx.fillStyle = "#a7d8b8";

      for (let i = 0; i < 8; i++) {
        const x = i * 350 - cameraX * 0.4;

        ctx.beginPath();

        ctx.moveTo(x, 550);
        ctx.lineTo(x + 170, 300);
        ctx.lineTo(x + 350, 550);

        ctx.fill();
      }
    }

    function drawPlatforms() {
      for (const platform of platforms) {
        ctx.fillStyle = "#9bd18b";

        ctx.fillRect(
          platform.x - cameraX,
          platform.y,
          platform.width,
          platform.height
        );

        ctx.fillStyle = "#78bd69";

        ctx.fillRect(
          platform.x - cameraX,
          platform.y,
          platform.width,
          8
        );
      }
    }

    function drawCoins() {
      for (const coin of coins) {
        if (coin.collected) continue;

        ctx.fillStyle = "#ffd85a";

        ctx.beginPath();

        ctx.arc(
          coin.x - cameraX,
          coin.y,
          12,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#fff3a5";

        ctx.beginPath();

        ctx.arc(
          coin.x - cameraX - 4,
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
        ctx.fillStyle = "#ff8f9f";

        ctx.beginPath();

        ctx.moveTo(
          obstacle.x - cameraX,
          obstacle.y + obstacle.height
        );

        ctx.lineTo(
          obstacle.x - cameraX + obstacle.width / 2,
          obstacle.y
        );

        ctx.lineTo(
          obstacle.x - cameraX + obstacle.width,
          obstacle.y + obstacle.height
        );

        ctx.fill();
      }
    }

    function drawFinish() {
      const x = finish.x - cameraX;

      ctx.fillStyle = "#7d6cff";

      ctx.fillRect(
        x,
        finish.y,
        8,
        finish.height
      );

      ctx.fillStyle = "#ff9fc5";

      ctx.beginPath();

      ctx.moveTo(x + 8, finish.y);
      ctx.lineTo(x + 70, finish.y + 25);
      ctx.lineTo(x + 8, finish.y + 50);

      ctx.fill();
    }

    function drawPlayer() {
      const x = player.x - cameraX;
      const y = player.y;

      // Corpo
      ctx.fillStyle = "#ffffff";

      ctx.beginPath();

      ctx.roundRect(
        x,
        y + 15,
        player.width,
        40,
        15
      );

      ctx.fill();

      // Cabeça
      ctx.beginPath();

      ctx.arc(
        x + 22,
        y + 12,
        22,
        0,
        Math.PI * 2
      );

      ctx.fill();

      // Orelhas
      ctx.fillStyle = "#ffffff";

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

      // Orelhas rosas
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

      // Olhos
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

      // Nariz
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
    }

    function update() {
      controls();
      physics();
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
      drawFinish();
      drawPlayer();
    }

    function gameLoop() {
      update();
      draw();

      animationFrame =
        requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener(
        "keydown",
        keyDown
      );

      window.removeEventListener(
        "keyup",
        keyUp
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
        fontFamily: "Arial, sans-serif",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />

      {/* HUD */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "25px",
          padding: "12px 25px",
          background: "rgba(255,255,255,0.88)",
          borderRadius: "25px",
          boxShadow:
            "0 5px 20px rgba(0,0,0,0.12)",
          color: "#555",
          fontSize: "18px",
          fontWeight: "bold",
          zIndex: 10,
        }}
      >
        <span>⭐ {score}</span>
        <span>🔥 Combo: {combo}</span>
      </div>

      {/* Controles */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 22px",
          background: "rgba(255,255,255,0.9)",
          borderRadius: "20px",
          color: "#555",
          boxShadow:
            "0 5px 15px rgba(0,0,0,0.1)",
          zIndex: 10,
          whiteSpace: "nowrap",
        }}
      >
        <b>A / D</b> ou <b>← / →</b> mover
        &nbsp; • &nbsp;
        <b>Espaço</b> pular
        &nbsp; • &nbsp;
        <b>Shift</b> dash
      </div>

      {/* Tela de vitória */}
      {won && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background:
              "rgba(180,230,245,0.65)",
            backdropFilter: "blur(5px)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "40px 60px",
              borderRadius: "30px",
              textAlign: "center",
              boxShadow:
                "0 15px 50px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontSize: "70px" }}>
              🐰
            </div>

            <h1 style={{ color: "#ff8fbd" }}>
              Você conseguiu!
            </h1>

            <p style={{ color: "#666" }}>
              O Bunny chegou ao final! 🎉
            </p>

            <p style={{ color: "#666" }}>
              ⭐ Estrelas: <b>{score}</b>
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              style={{
                border: "none",
                padding: "12px 25px",
                marginTop: "15px",
                borderRadius: "20px",
                background: "#ff9fc5",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
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