const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const starCount = 200;
let stars = [];
let points = 0;
const colors = ["#004A8F", "#C337C3", "#002C55", "#FCFCFC"];

const createStars = () => {
	for (let i = 0; i < starCount; i++) {
		stars.push({
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			size: Math.random() * 3,
			speed: Math.random() * 0.5 + 0.5,
			color: colors[Math.floor(Math.random() * colors.length)],
		});
	}
};

const drawStars = () => {
	stars.forEach((star) => {
		ctx.fillStyle = star.color;
		ctx.beginPath();
		ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
		ctx.fill();
		star.y += star.speed;
		if (star.y > canvas.height) star.y = 0;
	});
};

const planeImage = new Image();
planeImage.src = "/images/spaceship.png";

const bulletImage = new Image();
bulletImage.src = "/images/bullet-space.png";

const asteroidImage = new Image();
asteroidImage.src = "/images/asteroid.png";

let player = {
	x: canvas.width / 2,
	y: canvas.height - 60,
	width: 60,
	height: 60, 	
	speed: 6,
	dx: 0,
	dy: 0,
	angle: 0,
	rotationSpeed: 0.05,
	inertia: 0.05,
	exploded: false,
	explosionState: 0,
};

let bullets = [];
let asteroids = [];

const drawPlayer = () => {
	if (player.exploded) {
		const colors = ["yellow", "orange", "red", "darkred"];
		ctx.fillStyle = colors[player.explosionState - 1];
		ctx.beginPath();
		ctx.arc(
			player.x,
			player.y,
			30 + player.explosionState * 10,
			0,
			Math.PI * 2
		);
		ctx.fill();
	} else {
		ctx.save();
		ctx.translate(player.x, player.y);
		ctx.rotate(player.angle);
		ctx.drawImage(
			planeImage,
			-player.width / 2,
			-player.height / 2,
			player.width,
			player.height
		);
		ctx.restore();
	}
};

const updatePlayer = () => {
	if (player.exploded) return;

	player.x += player.dx;
	player.y += player.dy;

	if (player.x < 0) player.x = 0;
	if (player.x + player.width > canvas.width)
		player.x = canvas.width - player.width;
	if (player.y < 0) player.y = 0;
	if (player.y + player.height > canvas.height)
		player.y = canvas.height - player.height;

	player.dx *= 1 - player.inertia;
	player.dy *= 1 - player.inertia;

	drawPlayer();
};

const keys = {};
document.addEventListener("keydown", (e) => {
	keys[e.key.toLowerCase()] = true;
	if (e.key === "Enter") shoot();
});

document.addEventListener("mousedown", (e) => {
	if (e.button === 0) {
		shoot();
	}
});

document.addEventListener("keyup", (e) => {
	keys[e.key.toLowerCase()] = false;
});

const handleTouchMovement = (event) => {
	const touch = event.touches[0];
	if (touch) {
		const dx = touch.clientX - player.x;
		const dy = touch.clientY - player.y;
		const angle = Math.atan2(dy, dx);
		player.angle = angle;
	}
};

const shoot = () => {
	if (player.exploded) return;

	bullets.push({
		x: player.x,
		y: player.y,
		width: 10,
		height: 20,
		speed: 7,
		angle: player.angle,
	});
};

const handleMovement = () => {
	let dx = 0,
		dy = 0;

	if (keys["w"] || keys["arrowup"]) dy -= player.speed;
	if (keys["s"] || keys["arrowdown"]) dy += player.speed;
	if (keys["a"] || keys["arrowleft"]) dx -= player.speed;
	if (keys["d"] || keys["arrowright"]) dx += player.speed;

	player.dx = dx;
	player.dy = dy;
};

canvas.addEventListener("touchmove", (event) => {
	handleTouchMovement(event);
});

const drawBullets = () => {
	bullets.forEach((bullet, index) => {
		bullet.y -= bullet.speed;
		bullet.x += Math.sin(bullet.angle) * bullet.speed;
		ctx.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
		if (bullet.y < 0) bullets.splice(index, 1);
	});
};

const createAsteroids = () => {
	if (Math.random() < 0.02) {
		asteroids.push({
			x: Math.random() * canvas.width,
			y: -50,
			size: Math.random() * 30 + 20,
			speed: Math.random() * 2 + 2,
			exploded: false,
			explosionState: 0,
		});
	}
};

const drawAsteroids = () => {
	asteroids.forEach((asteroid, index) => {
		if (asteroid.exploded) {
			const explosionColors = ["#FFD700", "#FF4500", "#FF6347"];
			ctx.fillStyle = explosionColors[asteroid.explosionState - 1];
			ctx.beginPath();
			ctx.arc(
				asteroid.x,
				asteroid.y,
				30 + asteroid.explosionState * 10,
				0,
				Math.PI * 2
			);
			ctx.fill();
			asteroid.explosionState++;
			if (asteroid.explosionState > 3) asteroids.splice(index, 1);
		} else {
			asteroid.y += asteroid.speed;
			ctx.drawImage(
				asteroidImage,
				asteroid.x - asteroid.size / 2,
				asteroid.y - asteroid.size / 2,
				asteroid.size,
				asteroid.size
			);
			if (asteroid.y > canvas.height) asteroids.splice(index, 1);

			const dist = Math.sqrt(
				(player.x - asteroid.x) ** 2 + (player.y - asteroid.y) ** 2
			);
			if (dist < player.width / 2 + asteroid.size / 2 && !player.exploded) {
				player.exploded = true;
				player.explosionState = 1;
				points = 0;

				let explosionInterval = setInterval(() => {
					if (player.explosionState < 4) {
						player.explosionState++;
					} else {
						clearInterval(explosionInterval);
						setTimeout(() => {
							player.exploded = false;
							player.x = canvas.width / 2;
							player.y = canvas.height - 60;
						}, 300);
					}
				}, 100);
			}

			bullets.forEach((bullet, bulletIndex) => {
				const bulletDist = Math.sqrt(
					(bullet.x - asteroid.x) ** 2 + (bullet.y - asteroid.y) ** 2
				);
				if (bulletDist < asteroid.size) {
					asteroid.exploded = true;
					bullets.splice(bulletIndex, 1);
					points += 10;
				}
			});
		}
	});
};

const drawPoints = () => {
	ctx.font = "28px VT323";
	ctx.fillStyle = "#FFF";
	ctx.fillText("Pontos: " + points, 20, 50);
};

const gameLoop = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawStars();
	handleMovement();
	updatePlayer();
	drawBullets();
	createAsteroids();
	drawAsteroids();
	drawPoints();
	requestAnimationFrame(gameLoop);
};

createStars();
gameLoop();