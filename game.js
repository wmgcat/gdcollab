href = 'https://231877.github.io/gdcollab';
nmap = Map.init(16, 16);
grid_size = 16;
zoom = 2;
pause = editor = false;

let colours = {
	'black': '#1e053c', 'white': '#fff', 'grey': '#8c8c9b',
	'red': '#f0326e', 'blue': '#64b4e6', 'green': '#78d282', 'yellow': '#fffa69',
	'back': '#32467d'
};
Add.rule({
	'arrowup': 'up', 'arrowdown': 'down',
	'arrowleft': 'left', 'arrowright': 'right',
	'enter': 'mode', 'space': 'mode'
});
Add.image('./tileset.png');
Add.script('./42eng/editor.js');
Add.audio('./sounds/death.wav', './sounds/enter.wav', './sounds/gameover.wav', './sounds/key.wav',
	'./sounds/level.wav', './sounds/life.wav', './sounds/power.wav');
SETTING.sound = .25;
playerControl = {
	'life': 3, 'score': 0, 'vscore': 0,
	'speed': 1.25, 'scorelength': 5,
	'icon': Img.init('tileset', 0, 0, grid_size, grid_size, 0, 0, 1),
	'init': false, 'power': 0,
	'power_timer': 180, 'levelup': 0,
	'goto': {
		'active': false, 'alpha': 0,
		'speed': .05, 'spr': Img.init('tileset', 96, 48, 16, 16, 0, 0, 12)
	}, 'start': true, 'win': false
};

let player = Obj.init('player');
player.undeath = player.death = false;
player.image_index = Img.init('tileset', 0, 0, grid_size, grid_size, 8, 8, 2);
player.image_index.frame_spd = 0;
let enemy = Obj.init('enemy');
enemy.type = '';
enemy.death = false;
enemy.speed = 1;
let item = Obj.init('item');
item.type = 'key';
item.life = 10;
item.image_index.frame_spd = 0;
let finish = Obj.init('finish');
finish.open = false;
let spawn = Obj.init('spawn');

let autors = {
	'Cakeoo': Img.init('tileset', 0, 0, grid_size, grid_size, 0, 0, 1),
	'KusSv': Img.init('tileset', 64, 48, grid_size, grid_size, 0, 0, 1),
	'GumPix': Img.init('tileset', 64, 0, grid_size, grid_size, 0, 0, 1),
	'Pikseli.bmp': Img.init('tileset', 64, 16, grid_size, grid_size, 0, 0, 1),
	'deleted': Img.init('tileset', 80, 48, grid_size, grid_size, 0, 0, 1),
	'PavlinUs': Img.init('tileset', 0, 16, grid_size, grid_size, 0, 0, 1),
	'Pixel mania': Img.init('tileset', 0, 32, grid_size, grid_size, 0, 0, 3),
	'NephlimDeath': Img.init('tileset', 80, 32, grid_size, grid_size, 0, 0, 31),
	'Leyok': Img.init('tileset', 16, 16, grid_size, grid_size, 0, 0, 1),
	'MothApostle': Img.init('tileset', 32, 16, grid_size, grid_size, 0, 0, 1),
	"M'Arts": Img.init('tileset', 96, 48, grid_size, grid_size, 0, 0, 12),
	'Jajablocko': Img.init('tileset', 80, 16, grid_size, grid_size, 0, 0, 1),
	'MaksWellFox': Img.init('tileset', 0, 64, grid_size, grid_size, 0, 0, 1)
};

Level.init('./lvls/ground.txt', nmap, true);

function scoreboard(x) {
	let str = '';
	for (let i = 0; i < (playerControl.scorelength - ('' + x).length); i++) str += '0';
	str += '' + x;
	return str;
}
let canvas = Add.canvas('g', function(t) {
	gr.rect(cameraes[current_camera].x / zoom, cameraes[current_camera].y / zoom, canvas.id.width, canvas.id.height, colours.black);
	if (!editor) {
		cameraes[current_camera].x = Math.floor((nmap.w * grid_size * zoom - canvas.id.width) >> 1);
		cameraes[current_camera].y = Math.floor((nmap.h * grid_size * zoom - canvas.id.height) >> 1);
	}
	Search.search('player').forEach(function(obj) {
		obj.initialize = function() {
			obj.spawn_x = obj.x;
			obj.spawn_y = obj.y;
		}
		obj.update = function() {
			let hspd = Eng.sign(Byte.check('right') - Byte.check('left')), vspd = Eng.sign(Byte.check('down') - Byte.check('up')),
				speed = playerControl.speed * (1 + .5 * (obj.undeath != false)), score = {};
			hspd *= speed * (vspd == 0) * !obj.death;
			vspd *= speed * (hspd == 0) * !obj.death;
			if (hspd != 0 && (((obj.x + hspd) <= 0 && hspd < 0) || ((obj.x + grid_size + hspd) >= (nmap.w) * grid_size && hspd > 0))) obj.x = (obj.x + hspd <= 0) * (nmap.w - 1) * grid_size;
			if (vspd != 0 && (((obj.y + vspd) <= 0 && vspd < 0) || ((obj.y + grid_size + vspd) >= (nmap.h) * grid_size && vspd > 0))) obj.y = (obj.y + vspd <= 0) * (nmap.h - 1) * grid_size;
			if (obj.checkwall(hspd + grid_size * (hspd > 0), 0, hspd, 0, speed)) hspd = 0;
			if (obj.checkwall(hspd + grid_size * (hspd > 0), grid_size - speed, hspd, 1, speed)) hspd = 0;
			if (obj.checkwall(0, vspd + grid_size * (vspd > 0), 0, vspd, speed)) vspd = 0;
			if (obj.checkwall(grid_size - speed, vspd + grid_size * (vspd > 0), 1, vspd, speed)) vspd = 0;
			let xcell = Math.floor((obj.x + grid_size * .5 + hspd * grid_size) / grid_size) * grid_size,
				ycell = Math.floor((obj.y + grid_size * .5 + vspd * grid_size) / grid_size) * grid_size;
			obj.x += Eng.sign(xcell - obj.x) * speed;
			obj.y += Eng.sign(ycell - obj.y) * speed;
			if (Eng.distance(obj.x, obj.y, xcell, ycell) <= speed) {	
				obj.x = xcell;
				obj.y = ycell;
			}
			// столкновение:
			Search.distance(['item', 'enemy', 'finish'], obj.x + grid_size * .5, obj.y + grid_size * .5, grid_size * .5, grid_size * .5).forEach(function(nobj) {
				switch(nobj.name) {
					case 'item':
						switch(nobj.type) {
							case 'key':
								if (!nobj.hidden) {
									score = {'score': 10, 'power': 10, 'levelup': 10};
									nobj.hidden = true;
									emitter({
										'image_index': Img.init('tileset', 80, 8, 8, 8, 4, 4, 2),
										'alpha': 1, 'is_life': true,
										'life': 25, 'angle_start': 0, 'angle_end': 359,
										'spd': .4, 'yr': obj.y - 1
									}, nobj.x + grid_size * .5, nobj.y + grid_size * .5, 5, grid_size * .2);
									sound_play('sounds.key', SETTING.sound);
								}
							break;
							case 'power':
								if (!obj.undeath) obj.undeath = Timer.init(playerControl.power_timer);
								score = { 'score': 25, 'levelup': 25 };
								nobj.destroy();
								emitter({
									'image_index': Img.init('tileset', 80, 0, 8, 8, 4, 4, 1),
									'alpha': 1, 'alpha_end': 0,
									'life': 50, 'angle_start': 0, 'angle_start': 75, 'angle_end': 115,
									'spd': .25, 'yr': obj.y + 8
								}, nobj.x + grid_size * .5, nobj.y + grid_size * .5, grid_size, grid_size * .5);
								sound_play('sounds.power', SETTING.sound);
							break;
							case 'life':
								score = { 'score': 10, 'power': 10 };
								playerControl.life = Math.min(playerControl.life + 1, 3);
								nobj.destroy();
								emitter({
									'image_index': Img.init('tileset', 88, 0, 8, 8, 4, 4, 1),
									'alpha': 1, 'alpha_end': 0,
									'life': 50, 'angle_start': 0, 'angle_start': 75, 'angle_end': 115,
									'spd': .25, 'yr': obj.y + 8
								}, nobj.x + grid_size * .5, nobj.y + grid_size * .5, grid_size, grid_size * .5);
								sound_play('sounds.life', SETTING.sound);
							break;
						}
					break;
					case 'enemy':
						if (!obj.undeath) {
							if (!pause) {
								obj.death = true;
								Byte.clear();
							}
						} else { // режим бессмертия:
							let spawns = Search.search('spawn'), random = spawns[Math.floor(Math.random() * spawns.length)];
							nobj.x = random.x;
							nobj.y = random.y;
							nobj.path = undefined;
							score = { 'score': 25, 'levelup': 25 };
							sound_play('sounds.death', SETTING.sound);
						}
					break;
					case 'finish':
						if (nobj.open && !playerControl.init) { // переход на следующий уровень:
							pause = true;
							playerControl.goto.active = true;
						}
					break;
				}
			});
			Object.keys(score).forEach(function(e) { playerControl[e] += score[e]; });
			if (obj.death) { // смерть:
				if (!obj.death_timer) {
					obj.death_timer = Timer.init(25);
					obj.xx = Math.random() * 10 - 5;
				} else {
					if (obj.death_timer.check(true)) {
						obj.death_timer = obj.death = false;
						obj.yy = undefined;
						obj.x = obj.spawn_x;
						obj.y = obj.spawn_y;
						Search.search('enemy').forEach(function(enemy) {
							enemy.x = enemy.spawn_x;
							enemy.y = enemy.spawn_y;
							enemy.path = undefined;
						});
						Search.type('item', 'key').forEach(function(item) { item.hidden = false; });
						Search.search('finish').forEach(function(door) { door.open = false; });
						playerControl.life--;
						playerControl.init = pause = true;
						sound_play('sounds.gameover', SETTING.sound);
					} else {
						cameraes[current_camera].x += Math.random() * 4 - 2;
						cameraes[current_camera].y += Math.random() * 4 - 2;
						if (obj.yy == undefined) obj.yy = -5;
						obj.yy += 1.2;
						obj.x += obj.xx;
						obj.y += Math.min(obj.yy, 10);
					}
				}
			}
			// появление дополнительных жизней и усилителя:
			if (playerControl.power >= 60) {
				let spawns = Search.search('spawn'), random = spawns[Math.floor(Math.random() * spawns.length)];
				let item = Add.object('item', random.x, random.y);
				item.type = 'power';
				playerControl.power = 0;
			}
			if (playerControl.levelup >= 250) {
				let spawns = Search.search('spawn'), random = spawns[Math.floor(Math.random() * spawns.length)];
				let item = Add.object('item', random.x, random.y);
				item.type = 'life';
				playerControl.levelup = 0;
			}
			if (obj.undeath) {
				if (obj.undeath.check(true)) obj.undeath = false;
				else {
					if (Math.random() <= .2) {
						let dir = Eng.direction(0, 0, hspd, vspd);
						emitter({
							'image_index': Img.init('tileset', 80, 0, 8, 8, 4, 4, 1),
							'alpha': 1, 'scale': 1, 'scale_end': 0,
							'life': 75, 'angle_start': 0, 'angle_start': (Eng.todeg(dir) - 45) || 0, 'angle_end': (Eng.todeg(dir) + 45) || 359,
							'spd': .3, 'yr': obj.y - 1
						}, obj.x + grid_size * .5, obj.y + grid_size * .5, 1, grid_size * .2);
					}
				}
			}
		}
		obj.checkwall = function(x, y, hspd, vspd, speed) {
			if (obj.x + x > 0 && obj.x + x < nmap.w * grid_size && obj.y + y > 0 && obj.y + y < nmap.h * grid_size) {
				if (nmap.get(Math.floor((obj.x + x) / grid_size), Math.floor((obj.y + y) / grid_size))) {
					while(!nmap.get(Math.floor((obj.x + Eng.sign(hspd) + (grid_size - speed) * (hspd > 0)) / grid_size), Math.floor((obj.y + Eng.sign(vspd) + (grid_size - speed) * (vspd > 0)) / grid_size))) {
						obj.x += Eng.sign(hspd);
						obj.y += Eng.sign(vspd);
					}
					return true;
				}
				return false;
			}
			return true
		}
		obj.draw(function(cvs) {
			let view = !(obj.undeath && obj.undeath.delta() <= .4 && Math.floor(obj.undeath.delta() * 100 % 4) == 0);
			if (view) obj.image_index.draw(cvs, obj.x + grid_size * .5, obj.y + grid_size * .5, undefined, undefined, 1, 1, 1);
		});
	});
	Search.search('enemy').forEach(function(obj) {
		obj.initialize = function() {
			let assoc = {
				1: { 'left': 0, 'top': 32, 'frame': 3, 'speed': .4, 'frame_spd': .2 },
				2: { 'left': 64, 'top': 16, 'speed': .8 },
				3: { 'left': 80, 'top': 16, 'speed': .5 },
				4: { 'left': 80, 'top': 16, 'speed': .6 },
				5: { 'left': 80, 'top': 32, 'frame': 31, 'frame_spd': .25 },
				6: { 'left': 80, 'top': 16, 'speed': .9 },
			}
			if (assoc[obj.type]) {
				obj.image_index = Img.init('tileset', assoc[obj.type].left || 0, assoc[obj.type].top || 0, grid_size, grid_size, 0, 0, assoc[obj.type].frame || 1);
				obj.image_index.frame_spd = assoc[obj.type].frame_spd || 0;
				obj.speed = assoc[obj.type].speed || 1;
				if (obj.type == 5) {
					obj.delta = 100;
					obj.respawn = false;
					obj.timer = Timer.init(obj.delta);
				}
			}
			obj.spawn_x = obj.x;
			obj.spawn_y = obj.y;
		}
		obj.update = function() {
			if (obj.type == 1 || obj.type == 6) {
				if (!obj.items) obj.items = Search.type('item', 'key');
				let count = obj.items.length;
				obj.items.forEach(function(e) { if (e.hidden) count--; });
				if (obj.type == 1 && count <= 3) {
					obj.type = 6;
					obj.initialize();
				}
				if (obj.type == 6 && count > 3) {
					obj.type = 1;
					obj.initialize();
				}
			}
			if (playerControl.id) {
				if (!obj.path) {
					obj.path = nmap.path(Math.floor((obj.x + grid_size * .5) / grid_size), Math.floor((obj.y + grid_size * .5) / grid_size), Math.floor((playerControl.id.x + grid_size * .5) / grid_size), Math.floor((playerControl.id.y + grid_size * .5) / grid_size));
					obj.select = 1;
				}
				if (obj.path && obj.path.length > 0) {
					if (obj.select < obj.path.length) {
						switch(obj.type) {
							case 1:
								case 2:
								obj.x += Eng.sign(obj.path[obj.select][0] * grid_size - obj.x) * obj.speed;
								obj.y += Eng.sign(obj.path[obj.select][1] * grid_size - obj.y) * obj.speed;
							break;
							case 3:
								obj.x += Eng.sign(obj.path[obj.select][0] * grid_size - obj.x) * obj.speed;
								obj.y += Eng.sign(obj.path[obj.select][1] * grid_size - obj.y) * obj.speed;
								obj.select = obj.path.length - 1;
							break;
							case 4:
								obj.x += Eng.sign(obj.path[obj.select][0] * grid_size - obj.x) * obj.speed;
								obj.y += Eng.sign(obj.path[obj.select][1] * grid_size - obj.y) * obj.speed;
								if (obj.select > 5) obj.path = undefined;
							break;
							case 5:
								if (obj.timer.check()) {
									if (!obj.respawn) {
										let spawns = Search.search('spawn'), random = spawns[Math.floor(Math.random() * spawns.length)];
										obj.nx = random.x;
										obj.ny = random.y;
									} else {
										obj.x = obj.nx;
										obj.y = obj.ny;
									}
									obj.respawn =! obj.respawn;
								}
								if (obj.respawn && Math.random() <= .1)
									emitter({
										'image_index': Img.init('tileset', 96, 0, 8, 8, 4, 4, 2),
										'alpha': 1, 'is_life': true,
										'life': 30, 'angle_start': 0, 'angle_end': 359,
										'spd': .25, 'yr': obj.y + 1
									}, obj.nx + grid_size * .5, obj.ny + grid_size * .5, 2, grid_size * .5);
							break;
							case 6:
								obj.x += Eng.sign(obj.path[obj.select][0] * grid_size - obj.x) * obj.speed;
								obj.y += Eng.sign(obj.path[obj.select][1] * grid_size - obj.y) * obj.speed;
								if (obj.select > 7) obj.path = undefined;
							break;
						}
						if (obj.path && Eng.distance(obj.x, obj.y, obj.path[obj.select][0] * grid_size, obj.path[obj.select][1] * grid_size) <= 2) obj.select++;
					} else obj.path = undefined;
				}
			}
		}
		obj.draw(function(cvs) {
			if (!editor && obj.image_index) obj.image_index.draw(cvs, obj.x, obj.y);
			if (editor) {
				gr.rect(obj.x, obj.y, grid_size, grid_size, colours.red);
				gr.text('' + obj.type, obj.x + grid_size * .5, obj.y + grid_size * .5, colours.black, 1, 8, 'wpixel', 'fill', 'center-middle');
			}
		});
	});
	Search.search('item').forEach(function(obj) { // предметы:
		obj.initialize = function() {
			obj.image_index = Img.init('tileset', 0, grid_size, grid_size, grid_size, 0, 0, 4);
			let assoc = {'key': 0, 'power': 2, 'life': 1};
			obj.image_index.frame = assoc[obj.type] || 0;
			obj.image_index.frame_spd = 0;
			if (obj.type == 'power' || obj.type == 'life') obj.timer = Timer.init(250);
		}
		obj.update = function() {
			if ((obj.type == 'power' || obj.type == 'life') && obj.timer) {
				if (obj.timer.check(true)) obj.destroy();
				else {
					if (obj.timer.delta() <= .4) {
						if (Math.floor(obj.timer.delta() * 100 % 4) == 0) obj.hidden = true;
						else obj.hidden = false;
					} 
				}
			}
		}
		obj.draw(function(cvs) {
			if (!editor && !obj.hidden) obj.image_index.draw(cvs, obj.x, obj.y);
			if (editor) {
				gr.rect(obj.x, obj.y, grid_size, grid_size, colours.green);
				gr.text(obj.type, obj.x + grid_size * .5, obj.y + grid_size * .5, colours.black, 1, 8, 'wpixel', 'fill', 'center-middle');
			}
		});
	});
	Search.search('finish').forEach(function(obj) {
		obj.initialize = function() {
			let id = Add.object('player', obj.x, obj.y);
			playerControl.init = pause = true;
			playerControl.id = id;
			obj.image_index = Img.init('tileset', 64, 0, grid_size, grid_size, 0, 0, 1);
		}
		obj.update = function() {
			if (!obj.items) obj.items = Search.type('item', 'key');
			let count = obj.items.length;
			obj.items.forEach(function(item) { if (item.hidden) count--; });
			obj.open = !count;
			if (obj.open != obj.save_open) {
				if (obj.open)
					emitter({
						'image_index': Img.init('tileset', 80, 0, 8, 8, 4, 4, 1),
						'alpha': 1, 'alpha_end': 0,
						'life': 50, 'angle_start': 0, 'angle_end': 359,
						'spd': .25, 'yr': obj.y - 1
					}, obj.x + grid_size * .5, obj.y + grid_size * .5, grid_size, grid_size * .5);
				obj.save_open = obj.open;
			}
		}
		obj.draw(function(cvs) {
			if (obj.open && !playerControl.init) obj.image_index.draw(cvs, obj.x, obj.y);
			if (editor) {
				gr.rect(obj.x, obj.y, grid_size, grid_size, colours.yellow);
				gr.text(obj.name, obj.x + grid_size * .5, obj.y + grid_size * .5, colours.black, 1, 8, 'wpixel', 'fill', 'center-middle');
			}
		});
	});
	Search.search('spawn').forEach(function(obj) {
		obj.draw(function(cvs) {
			if (editor) {
				gr.rect(obj.x, obj.y, grid_size, grid_size, colours.blue);
				gr.text(obj.name, obj.x + grid_size * .5, obj.y + grid_size * .5, colours.black, 1, 8, 'wpixel', 'fill', 'center-middle');
			}
		});
	})
	Search.search('$part').forEach(function(obj) { obj.draw(obj); });
	nmap.draw(function(cvs) {
		gr.rect(0, 0, nmap.w * grid_size, nmap.h * grid_size, colours.back);
		let is_line = false, nmemory = {}, scale = 1;
		if (editor && memory.editor && memory.editor.grid != undefined) is_line = memory.editor.grid;
		Object.keys(nmap.memory).forEach(function(e) { if (typeof(nmap.memory[e]) == 'object') nmemory[nmap.memory[e][0]] = nmap.memory[e][1]; });
		if (is_line) gr.rect(0, 0, nmap.grid.length * grid_size, nmap.grid[0].length * grid_size, colours.white, 1, 'stroke');
		for (let i = nmap.grid.length - 1; i > -1; i--) {
			if (is_line) gr.line(i * grid_size, 0, i * grid_size, nmap.grid[i].length * grid_size, colours.white);
			for (let j = nmap.grid[i].length - 1; j > -1; j--) {
				if (is_line) gr.line(0, j * grid_size, nmap.grid.length * grid_size, j * grid_size, colours.white);
				if (nmemory[nmap.grid[i][j]] && scale > 0) nmemory[nmap.grid[i][j]].draw(cvs, i * grid_size + ((grid_size >> 1) - (grid_size >> 1) * scale), j * grid_size + ((grid_size >> 1) - (grid_size >> 1) * scale), grid_size * scale, grid_size * scale);
				else { if (nmap.grid[i][j] == 1) woodFloor.draw(cvs, i * grid_size, j * grid_size); }
			}
		}
	});
	if (editor) Editor(canvas.cvs, canvas.id, nmap);
	else {
		if (playerControl.win) {
			add_gui(function(cvs) { // win:
				gr.rect(0, 0, canvas.id.width, canvas.id.height, colours.black);
				gr.text('you win!', canvas.id.width * .5, canvas.id.height * .5, colours.yellow, 1, 24 * zoom, 'wpixel', 'fill', 'center-bottom');
				gr.text('score: ' + scoreboard(playerControl.score), canvas.id.width * .5, canvas.id.height * .5, colours.white, 1, 18 * zoom, 'wpixel', 'fill', 'center-top')
				if (Math.floor((t * .005) % 4) >= 1) gr.text('press enter to restart', canvas.id.width * .5, canvas.id.height * .75, colours.white, 1, 18 * zoom, 'wpixel', 'fill', 'center-top');
				if (Byte.check('mode')) {
					window.location.reload();
					sound_play('sounds.enter', SETTING.sound);
					Byte.clear();
				}
			});
		} else {
			if (playerControl.life <= 0) {
				pause = true;
				add_gui(function(cvs) { // game over:
					gr.rect(0, 0, canvas.id.width, canvas.id.height, colours.black);
					gr.text('game over', canvas.id.width * .5, canvas.id.height * .5, colours.red, 1, 24 * zoom, 'wpixel', 'fill', 'center-bottom');
					gr.text('score: ' + scoreboard(playerControl.score), canvas.id.width * .5, canvas.id.height * .5, colours.yellow, 1, 18 * zoom, 'wpixel', 'fill', 'center-top')
					if (Math.floor((t * .005) % 4) >= 1) gr.text('press enter to restart', canvas.id.width * .5, canvas.id.height * .75, colours.white, 1, 18 * zoom, 'wpixel', 'fill', 'center-top');
					if (Byte.check('mode')) {
						window.location.reload();
						sound_play('sounds.enter', SETTING.sound);
						Byte.clear();
					}
				});
			} else {
				for (let i = 0; i < playerControl.life; i++) playerControl.icon.draw(gr.cvs, (grid_size + 4) * i, -grid_size - 4);
				playerControl.vscore += (playerControl.score - playerControl.vscore) * .2;
				let is_undeath = Search.search('player').length >= 1 && Search.search('player')[0].undeath;
				if (Math.abs(playerControl.vscore - playerControl.score) <= .2) playerControl.vscore = playerControl.score;
				gr.text('score: ' + scoreboard(Math.floor(playerControl.vscore)), nmap.w * grid_size, -grid_size * .5 - 4, colours[(playerControl.vscore == playerControl.score && !is_undeath) ? 'white' : 'yellow'], 1, 18, 'wpixel', 'fill', 'right-middle');
				if (pause && playerControl.init) {
					if (!playerControl.start) {
						if (Math.floor((t * .005) % 4) >= 1) gr.text('press enter to run', nmap.w * grid_size * .5, nmap.h * grid_size + 4, colours.yellow, 1, 18, 'wpixel', 'fill', 'center-top');
						if (Byte.key != 0) {
							pause = false;
							playerControl.init = false;
						}
					} else {
						add_gui(function(cvs) { // main menu:
							let scale = canvas.id.width / 800;
							gr.rect(0, 0, canvas.id.width, canvas.id.height, colours.black);
							gr.text('gdcollab-game!', canvas.id.width * .5, canvas.id.height * .25, colours.yellow, 1, Math.floor(20 * zoom * scale), 'wpixel', 'fill', 'center-bottom');
							let count = 5, size = grid_size * 5 * zoom * scale, rautors = Object.keys(autors), xx = (canvas.id.width - Math.floor(rautors.length / count) * size) * .5;
							for (let i = 0; i < rautors.length; i++) {
								let nx = xx + size * Math.floor(i / count), ny = canvas.id.height * .3 + (i % count) * grid_size * zoom * scale * 1.1;
								let l = gr.text(rautors[i], nx, ny, colours.white, 1, Math.floor(8 * zoom * scale), 'wpixel', 'fill', 'center-middle');
								let img_size = grid_size * zoom * scale;
								autors[rautors[i]].draw(cvs, nx - l * .5 - img_size * 1.5, ny - img_size * .5, img_size, img_size);
								autors[rautors[i]].frame_spd = .25;
							}
							if (Math.floor((t * .005) % 4) >= 1) gr.text('press enter to start!', canvas.id.width * .5, canvas.id.height * .75, colours.yellow, 1, Math.floor(14 * zoom * scale), 'wpixel', 'fill', 'center-top');
							if (Byte.check('mode')) {
								playerControl.start = false;
								sound_play('sounds.enter', SETTING.sound);
								Byte.clear();
							}
						});
					}
				}
			}
			if (playerControl.goto.active && playerControl.goto.alpha >= 1) {
				let levels = Object.keys(current_level.levels);
				for (let i = 0; i < levels.length; i++) {
					if (levels[i] == current_level.location) {
						playerControl.score += 100;
						playerControl.levelup += 100;
						if (i + 1 >= levels.length) playerControl.win = true;
						current_level.load(levels[(i + 1) % levels.length], nmap);
						playerControl.power = playerControl.levelup = 0;
						sound_play('sounds.level', SETTING.sound);
						Byte.clear();
						playerControl.goto.active = false;
						break;
					}
				}
			}
			// переход между уровнями:
			playerControl.goto.alpha = Eng.clamp(playerControl.goto.alpha + playerControl.goto.speed * (playerControl.goto.active - !playerControl.goto.active), 0, 1);
			add_gui(function(cvs) {
				if (playerControl.goto.alpha > 0) {
					if (playerControl.goto.active) {
						for (let i = 0; i < Math.floor(nmap.w * playerControl.goto.alpha); i++) {
							for (let j = 0; j < nmap.h; j++)
								playerControl.goto.spr.draw(cvs, canvas.id.width * .5 - (nmap.w * grid_size) * zoom * .5 + (grid_size * zoom) * i, canvas.id.height * .5 - (nmap.h * grid_size) * zoom * .5 + (grid_size * zoom) * j, undefined, undefined, 1, zoom, zoom);
						}
					} else {
						for (let i = Math.floor(nmap.w * playerControl.goto.alpha); i > -1 ; i--) {
							for (let j = 0; j < nmap.h; j++)
								playerControl.goto.spr.draw(cvs, canvas.id.width * .5 - (nmap.w * grid_size) * zoom * .5 + (grid_size * zoom) * i, canvas.id.height * .5 - (nmap.h * grid_size) * zoom * .5 + (grid_size * zoom) * j, undefined, undefined, 1, zoom, zoom);
						}
					}
					playerControl.goto.spr.frame_spd = .25 / (nmap.w * nmap.h);
				}
			});
		}
	}
}, function(a, t) {
	gr.rect(0, 0, canvas.id.width, canvas.id.height, colours.black);
	show_error(canvas.cvs, colours.white);
}), gr = Graphics.init(canvas.cvs);
canvas.update();
show_error(canvas.cvs);
