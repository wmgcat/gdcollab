href = 'https://wmgcat.itch.io/wiztopia';
nmap = Map.init(11, 11);
zoom = 2;
grid_size = 16;
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

playerControl = {
	'life': 3, 'score': 0, 'vscore': 0,
	'speed': 1.25, 'scorelength': 5,
	'icon': Img.init('tileset', 0, 0, grid_size, grid_size, 0, 0, 1),
	'init': false, 'power': 0,
	'power_timer': 180, 'levelup': 0,
	'goto': {
		'active': false,
		'alpha': 0,
		'speed': .05,
		'spr': Img.init('tileset', 48, 16, 16, 16, 0, 0, 1)
	}
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
item.type = '';
item.life = 10;
item.image_index.frame_spd = 0;
let finish = Obj.init('finish');
finish.open = false;
let spawn = Obj.init('spawn');

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
				speed = playerControl.speed * (1 + .5 * (obj.undeath != false));
			hspd *= speed * (vspd == 0);
			vspd *= speed * (hspd == 0);
			let dir = Eng.todeg(Eng.direction(0, 0, hspd, vspd));
			if (dir != obj.dir && (hspd || vspd)) {
				obj.dir = dir;
			}
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
			// items:
			Search.distance(['item', 'enemy', 'finish'], obj.x + grid_size * .5, obj.y + grid_size * .5, grid_size * .5, grid_size * .5).forEach(function(nobj) {
				switch(nobj.name) {
					case 'item':
						switch(nobj.type) {
							case 'key':
								if (!nobj.hidden) {
									playerControl.score += 10;
									playerControl.power += 10;
									playerControl.levelup += 10;
									nobj.hidden = true;
									emitter({
										'image_index': Img.init('tileset', 80, 8, 8, 8, 4, 4, 2),
										'alpha': 1, 'is_life': true,
										'life': 25, 'angle_start': 0, 'angle_end': 359,
										'spd': .4, 'yr': obj.y - 1
									}, nobj.x + grid_size * .5, nobj.y + grid_size * .5, 5, grid_size * .2);
								}
							break;
							case 'power':
								if (!obj.undeath) obj.undeath = Timer.init(playerControl.power_timer);
								playerControl.score += 25;
								playerControl.levelup += 25;
								nobj.destroy();
								emitter({
									'image_index': Img.init('tileset', 80, 0, 8, 8, 4, 4, 1),
									'alpha': 1, 'alpha_end': 0,
									'life': 50, 'angle_start': 0, 'angle_start': 75, 'angle_end': 115,
									'spd': .25, 'yr': obj.y + 8
								}, nobj.x + grid_size * .5, nobj.y + grid_size * .5, grid_size, grid_size * .5);
							break;
							case 'life':
								playerControl.score += 10;
								playerControl.power += 10;
								playerControl.life++;
								nobj.destroy();
								emitter({
									'image_index': Img.init('tileset', 88, 0, 8, 8, 4, 4, 1),
									'alpha': 1, 'alpha_end': 0,
									'life': 50, 'angle_start': 0, 'angle_start': 75, 'angle_end': 115,
									'spd': .25, 'yr': obj.y + 8
								}, nobj.x + grid_size * .5, nobj.y + grid_size * .5, grid_size, grid_size * .5);
							break;
						}
					break;
					case 'enemy':
						if (!obj.undeath) {
							if (!pause) {
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
								playerControl.init = true;
								pause = true;
								Byte.clear();
							}
						} else { // режим бессмертия:
							let spawns = Search.search('spawn'), random = spawns[Math.floor(Math.random() * spawns.length)];
							nobj.x = random.x;
							nobj.y = random.y;
							nobj.path = undefined;
							playerControl.score += 25;
							playerControl.levelup += 25;
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
			let view = true;
			if (obj.undeath && obj.undeath.delta() <= .4) {
				if (Math.floor(obj.undeath.delta() * 100 % 4) == 0) view = false;
			}
			if (view) obj.image_index.draw(cvs, obj.x + grid_size * .5, obj.y + grid_size * .5, undefined, undefined, 1, 1, 1, obj.dir);
		});
	});
	Search.search('enemy').forEach(function(obj) {
		obj.initialize = function() {
			obj.spawn_x = obj.x;
			obj.spawn_y = obj.y;
			switch(obj.type) {
				case 1:
					obj.image_index = Img.init('tileset', 0, 32, grid_size, grid_size, 0, 0, 3);
					obj.image_index.frame_spd = .2;
					obj.speed = .4;
				break;
				case 2:
					obj.image_index = Img.init('tileset', 64, 16, grid_size, grid_size, 0, 0, 1);
					obj.speed = .8;
				break;
				case 3:
					obj.image_index = Img.init('tileset', 80, 16, grid_size, grid_size, 0, 0, 1);
					obj.speed = .5;
				break;
				case 4:
					obj.image_index = Img.init('tileset', 80, 16, grid_size, grid_size, 0, 0, 1);
					obj.speed = 1;
				break;
				case 5:
					obj.image_index = Img.init('tileset', 80, 16, grid_size, grid_size, 0, 0, 1);
					obj.speed = .25;
				break;
			}
		}
		obj.update = function() {
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
						}
						if (Eng.distance(obj.x, obj.y, obj.path[obj.select][0] * grid_size, obj.path[obj.select][1] * grid_size) <= 2) obj.select++;
					} else {
						obj.path = undefined;
					}
				}
			}
		}
		obj.draw(function(cvs) {
			if (!editor && obj.image_index) obj.image_index.draw(cvs, obj.x, obj.y);
		});
	});
	Search.search('item').forEach(function(obj) {
		obj.initialize = function() {
			obj.image_index = Img.init('tileset', 0, grid_size, grid_size, grid_size, 0, 0, 4);
			switch(obj.type) {
				case 'key':
					obj.image_index.frame = 0;
				break;
				case 'power':
					obj.image_index.frame = 2;
					obj.timer = Timer.init(250);
				break;
				case 'life':
					obj.image_index.frame = 1;
					obj.timer = Timer.init(250);
				break;
			}
			obj.image_index.frame_spd = 0;
		}
		obj.update = function() {
			switch(obj.type) {
				case 'power':
					case 'life':
						if (obj.timer) {
							if (obj.timer.check(true)) obj.destroy();
							else {
								if (obj.timer.delta() <= .4) {
									if (Math.floor(obj.timer.delta() * 100 % 4) == 0) obj.hidden = true;
									else obj.hidden = false;
								}
							}
						}
				break;
			}
		}
		obj.draw(function(cvs) {
			if (!editor && !obj.hidden) obj.image_index.draw(cvs, obj.x, obj.y);
		});
	});
	Search.search('finish').forEach(function(obj) {
		obj.initialize = function() {
			pause = true;
			playerControl.init = true;
			let id = Add.object('player', obj.x, obj.y);
			playerControl.id = id;
			obj.image_index = Img.init('tileset', 64, 0, grid_size, grid_size, 0, 0, 1);
		}
		obj.update = function() {
			let items = Search.type('item', 'key'), count = items.length;
			items.forEach(function(item) { if (item.hidden) count--; });
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
		});
	});
	Search.search('spawn').forEach(function(obj) {
		obj.draw(function(cvs) {
			if (editor) gr.circle(obj.x + grid_size * .5, obj.y + grid_size * .5, grid_size * .5, colours.green);
		});
	});
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
		if (playerControl.life <= 0) {
			pause = true;
			add_gui(function(cvs) {
				gr.rect(0, 0, canvas.id.width, canvas.id.height, colours.black);
				gr.text('game over', canvas.id.width * .5, canvas.id.height * .5, colours.red, 1, 24 * zoom, 'wpixel', 'fill', 'center-bottom');
				gr.text('score: ' + scoreboard(playerControl.score), canvas.id.width * .5, canvas.id.height * .5, colours.yellow, 1, 18 * zoom, 'wpixel', 'fill', 'center-top')
				if (Math.floor((t * .005) % 4) >= 1) gr.text('press enter to restart', canvas.id.width * .5, canvas.id.height * .75, colours.white, 1, 18 * zoom, 'wpixel', 'fill', 'center-top');
				if (Byte.check('mode')) {
					window.location.reload();
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
				if (Math.floor((t * .005) % 4) >= 1) gr.text('press any key to start', nmap.w * grid_size * .5, nmap.h * grid_size + 4, colours.yellow, 1, 18, 'wpixel', 'fill', 'center-top');
				if (Byte.key != 0) {
					pause = false;
					playerControl.init = false;
				}
			}
		}
		if (playerControl.goto.active && playerControl.goto.alpha >= 1) {
			let levels = Object.keys(current_level.levels);
			for (let i = 0; i < levels.length; i++) {
				if (levels[i] == current_level.location) {
					playerControl.score += 100;
					playerControl.levelup += 100;
					current_level.load(levels[(i + 1) % levels.length], nmap);
					playerControl.power = playerControl.levelup = 0;
					Byte.clear();
					playerControl.goto.active = false;
					break;
				}
			}
		}
		playerControl.goto.alpha = Eng.clamp(playerControl.goto.alpha + playerControl.goto.speed * (playerControl.goto.active - !playerControl.goto.active), 0, 1);
		add_gui(function(cvs) {
			if (playerControl.goto.alpha > 0)
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
				
		});
	}
}, function(a, t) {
	gr.rect(0, 0, canvas.id.width, canvas.id.height, colours.black);
	show_error(canvas.cvs, colours.white);
}), gr = Graphics.init(canvas.cvs);
canvas.update();
show_error(canvas.cvs);
