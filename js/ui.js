
function UI(player) {
	this.actor = player;
	this.messages = [];
	this.messagesDirty = false;
	this.display = null;
	this.fps = 0;
	this.mouse = { x: 0, y: 0 };
	this.pressed = [];

	this.resetDisplay();
	CONFIG.debug = window.location.hash.indexOf("#debug") != -1;
	window.addEventListener('resize', this.resetDisplay.bind(this));
	document.addEventListener('keydown', this.onKeyDown.bind(this), false);
	document.addEventListener('keyup', this.onKeyUp.bind(this), false);

	if (!CONFIG.touch) {
		[].forEach.call(document.querySelectorAll(".btn"), function(elem) {
			elem.classList.add("btn-no-touch");
		});
	}

	$("#death-restart").addEventListener("click", function() {
		window.location.reload();
	}, false);
};

UI.prototype.onClick = function(e) {
	var coords = this.display.eventToPosition(e);
	var x = coords[0] + camera.pos[0];
	var y = coords[1] + camera.pos[1];
	if (!dungeon.getPassable(x, y)) return;
	dungeon.findPath(x, y, this.actor);
};

UI.prototype.onMouseMove = function(e) {
	var coords = this.display.eventToPosition(e);
	this.mouse.x = coords[0] + camera.pos[0];
	this.mouse.y = coords[1] + camera.pos[1];
};

UI.prototype.onKeyDown = function(e) {
	ui.pressed[e.keyCode] = true;
	if (this.pressed[ROT.VK_CONTROL] || this.pressed[ROT.VK_ALT]) // CTRL/ALT for browser hotkeys
		return;
	if (e.keyCode >= ROT.VK_F1 && e.keyCode <= ROT.VK_F12) // F1-F12
		return;

	if (e.keyCode == ROT.VK_LEFT || e.keyCode == ROT.VK_NUMPAD4 || e.keyCode == ROT.VK_H)
		this.actor.move(-1, 0);
	else if (e.keyCode == ROT.VK_RIGHT || e.keyCode == ROT.VK_NUMPAD6 || e.keyCode == ROT.VK_L)
		this.actor.move(1, 0);
	else if (e.keyCode == ROT.VK_UP || e.keyCode == ROT.VK_NUMPAD8 || e.keyCode == ROT.VK_K)
		this.actor.move(0, -1);
	else if (e.keyCode == ROT.VK_DOWN || e.keyCode == ROT.VK_NUMPAD2 || e.keyCode == ROT.VK_J)
		this.actor.move(0, 1);
	else if (e.keyCode == ROT.VK_INSERT || e.keyCode == ROT.VK_NUMPAD7 || e.keyCode == ROT.VK_Y)
		this.actor.move(-1, -1);
	else if (e.keyCode == ROT.VK_PAGE_UP || e.keyCode == ROT.VK_NUMPAD9 || e.keyCode == ROT.VK_U)
		this.actor.move(1, -1);
	else if (e.keyCode == ROT.VK_DELETE || e.keyCode == ROT.VK_NUMPAD1 || e.keyCode == ROT.VK_B)
		this.actor.move(-1, 1);
	else if (e.keyCode == ROT.VK_PAGE_DOWN || e.keyCode == ROT.VK_NUMPAD3 || e.keyCode == ROT.VK_N)
		this.actor.move(1, 1);

	e.preventDefault();
};

UI.prototype.onKeyUp = function(e) {
	this.pressed[e.keyCode] = false;
};

UI.prototype.resetDisplay = function() {
	var w = Math.floor(window.innerWidth / CONFIG.tileSize / CONFIG.tileMag);
	var h = Math.floor(window.innerHeight / CONFIG.tileSize / CONFIG.tileMag);
	camera = { pos: [0, 0], center: [(w/2)|0, (h/2)|0] };

	if (this.display)
		document.body.removeChild(this.display.getContainer());

	this.display = new ROT.Display({
		width: w,
		height: h,
		bg: "#111",
		layout: "tile",
		fontSize: CONFIG.tileSize,
		tileWidth: CONFIG.tileSize * CONFIG.tileMag,
		tileHeight: CONFIG.tileSize * CONFIG.tileMag,
		tileSet: TILES.tileset,
		tileMap: TILES.tilemap,
		tileColorize: true
	});
	document.body.appendChild(this.display.getContainer());
	this.display.getContainer().addEventListener("click", this.onClick.bind(this), true);
	this.display.getContainer().addEventListener("mousemove", this.onMouseMove.bind(this), true);
	dungeon.needsRender = true;
};

UI.prototype.msg = function(msg, source) {
	if (source === undefined || source == this.actor) {
		this.messages.push(msg);
		this.messagesDirty = true;
	}
};

UI.prototype.update = function() {
	if (this.messagesDirty) {
		var msgBuf = "";
		var firstMsg = Math.max(this.messages.length-5, 0);
		var classes = [ "msg4", "msg3", "msg2", "msg1", "msg0" ];
		if (this.messages.length <= 4) classes.shift();
		if (this.messages.length <= 3) classes.shift();
		if (this.messages.length <= 2) classes.shift();
		if (this.messages.length <= 1) classes.shift();
		for (var i = firstMsg; i < this.messages.length; ++i)
			msgBuf += '<span class="' + classes.shift() + '">' + this.messages[i] + '</span><br/>';
		$("#messages").innerHTML = msgBuf;
		this.messagesDirty = false;
	}

	$("#health").innerHTML = this.actor.health;
	$("#gems").innerHTML = this.actor.inv.gems;
	$("#keys").innerHTML = this.actor.inv.keys;

	$("#fps").innerHTML = Math.round(this.fps);

	if (!CONFIG.touch) {
		var cursor = "default";
		var mx = this.mouse.x, my = this.mouse.y;
		if (this.actor.path.length) {
			cursor = "wait";
		} else if (this.actor.visibility(mx, my) > 0.1) {
			if (dungeon.getTile(mx, my, Dungeon.LAYER_ITEM))
				cursor = "cell";
			else if (dungeon.getPassable(mx, my))
				cursor = "crosshair";
		}
		this.display.getContainer().style.cursor = cursor;
	}
};

UI.prototype.render = function(camera, dungeon) {
	camera.pos[0] = this.actor.pos[0] - camera.center[0];
	camera.pos[1] = this.actor.pos[1] - camera.center[1];
	dungeon.draw(camera, this.display, this.actor);
};

UI.prototype.die = function() {
	var stats = ui.actor.stats;
	$("#death-turns").innerHTML = Math.round(stats.turns);
	$("#death-kills").innerHTML = Math.round(stats.kills);
	$("#death-screen").style.display = "block";
};