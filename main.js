import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

var scenes = [
	'05ce34e3cd48c449', '02e6fb86b0172f0b', '03b3f603a1001de0','06a8196a66e125af','02b2358ff02d3ce8', '0090cc64d7b7bb24','00ca5123d8ff6f83'
];
var sfc_scenes = [
	'02e6fb86b0172f0b', '05ce34e3cd48c449', '02b2358ff02d3ce8', '000db54a47bd43fe', '000c3ab189999a83', '00ca5123d8ff6f83', '00cfc0ecd345deb4'
]

var roi = {
	'0090cc64d7b7bb24':[{'bx':95,'by':35,'bh':40,'bw':80},{'bx':70,'by':180,'bh':150,'bw':80}, {'bx':220,'by':100,'bh':50,'bw':80}],
	'00ca5123d8ff6f83':[{'bx':80,'by':150,'bh':200,'bw':40}],
	'02b2358ff02d3ce8':[{'bx':130,'by':100,'bh':280,'bw':60}, {'bx':250,'by':360,'bh':50,'bw':145}],
	'02e6fb86b0172f0b':[{'bx':150,'by':90,'bh':300,'bw':40}, {'bx':80,'by':90,'bh':300,'bw':50}],
	'03b3f603a1001de0':[{'bx':265,'by':90,'bh':300,'bw':60}, {'bx':20,'by':120,'bh':120,'bw':230}],
	'05ce34e3cd48c449':[{'bx':100,'by':90,'bh':200,'bw':80}, {'bx':265,'by':80,'bh':40,'bw':90}],
	'06a8196a66e125af':[{'bx':120,'by':90,'bh':300,'bw':60}, {'bx':270,'by':50,'bh':250,'bw':50}],
};

class Sample_viewer{
	/*
	Viewer setup needs a mix of HTML and JS
	See the HTML and this class to see how to structure the HTML elements, their ids, and JS callbacks
	The prefix argument i used to identify the viewer, needs to be consistent with HTML for the JS to find the right elements
	*/
	constructor(prefix,max_idx,scene_codes){
		this.scene_codes = scene_codes
		this.n_scenes = scene_codes.length;
		this.prefix = prefix;
		this.max_idx = max_idx;
		this.cur_frame = 0;
		this.cur_sample = 0;
		this.scene_code = scene_codes[0];
		this.need_stop_anim = false;
		this.interval_id = null;
		this.anim_dir = 1;
		this.showing_box = false;
		for (let i=0;i<this.n_scenes;i++){
			document.getElementById(`${this.prefix}-scene-selector`).innerHTML += `<div onclick="${this.prefix}_viewer.change_scene(\'${scene_codes[i]}\');" class="col-1"> <img style="border-radius:1em;" class=selectable src="assets/cond/${scene_codes[i]}.png"> </div>`;
		}
	}
	update_ims(){
		/*
		This is the main method that takes all the image parameters and updates the images in the web page
		*/
		let frame_padded = this.cur_frame.toString();
		document.getElementById(`${this.prefix}-im`).src = `assets/frames/${this.scene_code}/${frame_padded}.png`;
	}

	/* ===================================================================================
	The methods below are used for image control, called by pushing buttons on the HTML
	=================================================================================== */
	change_scene(scene_code){
		this.scene_code = scene_code;
		this.update_ims();
		this.toggle_box();
		this.toggle_box();
	}
	change_variant(name){
		this.variant = name;
		if (this.variants){
			for (let nn of this.variants){
				document.getElementById(`${nn}_selector`).style.backgroundColor = '';
				document.getElementById(`${nn}_selector`).style.borderRadius = '1em';
			}
			document.getElementById(`${name}_selector`).style.backgroundColor = 'lightgrey';
			document.getElementById(`${name}_selector`).style.borderRadius = '1em';
		}
		this.update_ims();
	}

	/* ===================================================================================
	The methods below are used for automatic playback
	=================================================================================== */
	change_frame(idx){
		/*
		This is called when the user clicks and drags on the slider to see a specific frame
		This also stops the automatic playback
		*/
		this.stop_anim();
		this.cur_frame = parseInt(idx);
		this.update_ims();
	}
	next_frame(){
		/*
		This is used internally to play the sequence forward and backward, and also moves the slider to show the user what frame is being shown
		*/
		this.cur_frame += this.anim_dir;
		if (this.cur_frame >= this.max_idx) {this.anim_dir=-1;}
		if (this.cur_frame <= 0) {this.anim_dir=1;}
		document.getElementById(`${this.prefix}_frame_control`).value = this.cur_frame;
		this.update_ims();
	}
	cycle_frames(delay){
		/*
		Starts the automatic playback using JS intervals, see next_frame() to see the cycling behavior
		*/
		this.stop_anim();
		this.interval_id = setInterval(function() {
			this.next_frame();
		}.bind(this), delay);
		this.update_ims();
	}
	stop_anim(){
		if (this.interval_id){clearInterval(this.interval_id);}
		this.interval_id = null;
	}
	toggle_box(){
		if (this.showing_box){
			this.clear_box();
			this.showing_box = false;
		}
		else{
			this.place_box();
			this.showing_box = true;
		}
	}
	clear_box(){
		const svg = document.getElementById("box_svg");
		while (svg.firstChild) {
				svg.removeChild(svg.firstChild); // Removes all child elements
		}
	}
	place_box(){
		const im_h = 405;
		const im_w = 404;
		const topm = 60;
		const svgNS = "http://www.w3.org/2000/svg";
		const svg = document.getElementById("box_svg");

		let n_boxes = roi[this.scene_code].length;

		for (let n=0;n<n_boxes;n++){
			let bx = roi[this.scene_code][n]['bx'];
			let by = roi[this.scene_code][n]['by'];
			let bh = roi[this.scene_code][n]['bh'];
			let bw = roi[this.scene_code][n]['bw'];
			for (let r=0;r<3;r++){
				for (let c=0;c<4;c++){
					const rect = document.createElementNS(svgNS, "rect");
					rect.setAttribute("x", `${im_w + bx+c*im_w}`);
					rect.setAttribute("y", `${topm+by + r*im_h}`);
					rect.setAttribute("width", `${bw}`);
					rect.setAttribute("height", `${bh}`);
					rect.setAttribute("rx", "20");
					rect.setAttribute("ry", "20");
					rect.setAttribute("fill", "none");
					rect.setAttribute("stroke", "red");
					rect.setAttribute("stroke-width", "4");
					svg.appendChild(rect);
				}
			}
		}
	}
};

class Sample_viewer_sfc{
	/*
	Viewer setup needs a mix of HTML and JS
	See the HTML and this class to see how to structure the HTML elements, their ids, and JS callbacks
	The prefix argument i used to identify the viewer, needs to be consistent with HTML for the JS to find the right elements
	*/
	constructor(prefix,max_idx,scene_codes){
		this.scene_codes = scene_codes
		this.n_scenes = scene_codes.length;
		this.prefix = prefix;
		this.max_idx = max_idx;
		this.cur_frame = 0;
		this.cur_sample = 0;
		this.scene_code = scene_codes[0];
		this.need_stop_anim = false;
		this.interval_id = null;
		this.anim_dir = 1;
		this.showing_box = false;
		for (let i=0;i<this.n_scenes;i++){
			document.getElementById(`${this.prefix}-scene-selector`).innerHTML += `<div onclick="${this.prefix}_viewer.change_scene(\'${scene_codes[i]}\');" class="col-1"> <img style="border-radius:1em;" class=selectable src="assets/sfc/cond/${scene_codes[i]}.png"> </div>`;
		}
	}
	update_ims(){
		/*
		This is the main method that takes all the image parameters and updates the images in the web page
		*/
		let frame_padded = this.cur_frame.toString();
		document.getElementById(`${this.prefix}-im`).src = `assets/sfc/frames/${this.scene_code}/${frame_padded}.png`;
	}

	/* ===================================================================================
	The methods below are used for image control, called by pushing buttons on the HTML
	=================================================================================== */
	change_scene(scene_code){
		this.scene_code = scene_code;
		this.update_ims();
		this.toggle_box();
		this.toggle_box();
	}
	change_variant(name){
		this.variant = name;
		if (this.variants){
			for (let nn of this.variants){
				document.getElementById(`${nn}_selector`).style.backgroundColor = '';
				document.getElementById(`${nn}_selector`).style.borderRadius = '1em';
			}
			document.getElementById(`${name}_selector`).style.backgroundColor = 'lightgrey';
			document.getElementById(`${name}_selector`).style.borderRadius = '1em';
		}
		this.update_ims();
	}

	/* ===================================================================================
	The methods below are used for automatic playback
	=================================================================================== */
	change_frame(idx){
		/*
		This is called when the user clicks and drags on the slider to see a specific frame
		This also stops the automatic playback
		*/
		this.stop_anim();
		this.cur_frame = parseInt(idx);
		this.update_ims();
	}
	next_frame(){
		/*
		This is used internally to play the sequence forward and backward, and also moves the slider to show the user what frame is being shown
		*/
		this.cur_frame += this.anim_dir;
		if (this.cur_frame >= this.max_idx) {this.anim_dir=-1;}
		if (this.cur_frame <= 0) {this.anim_dir=1;}
		document.getElementById(`${this.prefix}_frame_control`).value = this.cur_frame;
		this.update_ims();
	}
	cycle_frames(delay){
		/*
		Starts the automatic playback using JS intervals, see next_frame() to see the cycling behavior
		*/
		this.stop_anim();
		this.interval_id = setInterval(function() {
			this.next_frame();
		}.bind(this), delay);
		this.update_ims();
	}
	stop_anim(){
		if (this.interval_id){clearInterval(this.interval_id);}
		this.interval_id = null;
	}
	toggle_box(){
		if (this.showing_box){
			this.clear_box();
			this.showing_box = false;
		}
		else{
			this.place_box();
			this.showing_box = true;
		}
	}
	clear_box(){
		const svg = document.getElementById("box_svg");
		while (svg.firstChild) {
				svg.removeChild(svg.firstChild); // Removes all child elements
		}
	}
};

// create the viewer here to make it global, and accessible from the HTML
var edge_viewer = null;
var sfc_viewer = null;

document.addEventListener("DOMContentLoaded", function() {
	// create the viewer, and set the initial frame
	edge_viewer = new Sample_viewer('edge',9,scenes);
	edge_viewer.change_frame(0);
	edge_viewer.cycle_frames(100);

	sfc_viewer = new Sample_viewer_sfc('sfc',9,sfc_scenes);
	sfc_viewer.change_frame(0);
	sfc_viewer.cycle_frames(100);
});
	
	
	
// === 3D Pose Viewer ===
document.addEventListener("DOMContentLoaded", function () {
	const viewer = document.getElementById('viewer');
	const scene = new THREE.Scene();

	const camera = new THREE.PerspectiveCamera(75, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);
	camera.position.set(5, 5, 5);
	camera.lookAt(0, 0, 0);

	// UI Scene for screen-space overlays
	const uiScene = new THREE.Scene();
	const aspect = viewer.clientWidth / viewer.clientHeight;
	const uiCamera = new THREE.OrthographicCamera(
	-aspect, aspect, // left, right
	1, -1,           // top, bottom
	0, 10            // near, far
	);

	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(viewer.clientWidth, viewer.clientHeight);
	viewer.appendChild(renderer.domElement);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	scene.add(new THREE.AmbientLight(0x404040));
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5, 10, 7.5);
	scene.add(light);

	const gridHelper = new THREE.GridHelper(9, 9);
	scene.add(gridHelper);

	function createThickArrow(dir, color) {
		const shaftLength = 0.8;
		const shaftRadius = 0.015;
		const headLength = 0.2;
		const headRadius = 0.04;

		const group = new THREE.Group();
		const shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 16);
		const shaftMaterial = new THREE.MeshBasicMaterial({ color });
		const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
		shaft.position.y = shaftLength / 2;
		group.add(shaft);

		const headGeometry = new THREE.ConeGeometry(headRadius, headLength, 16);
		const headMaterial = new THREE.MeshBasicMaterial({ color });
		const head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.y = shaftLength + headLength / 2;
		group.add(head);

		const defaultDir = new THREE.Vector3(0, 1, 0);
		const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultDir, dir.clone().normalize());
		group.quaternion.copy(quaternion);

		return group;
	}

	const axisGroup = new THREE.Group();
	axisGroup.add(createThickArrow(new THREE.Vector3(1, 0, 0), 0xff0000));
	axisGroup.add(createThickArrow(new THREE.Vector3(0, 1, 0), 0x00ff00));
	axisGroup.add(createThickArrow(new THREE.Vector3(0, 0, 1), 0x0000ff));
	axisGroup.position.set(-2, 0, 0);
	scene.add(axisGroup);

	function createCameraPyramid(size = 0.3, color = 0x888888) {
		const geometry = new THREE.BufferGeometry();
		const halfSize = size / 2;

		const vertices = new Float32Array([
		-halfSize, -halfSize, size,
			halfSize, -halfSize, size,
			halfSize,  halfSize, size,
		-halfSize,  halfSize, size,
			0, 0, 0
		]);

		const indices = [
		0, 1, 4,
		1, 2, 4,
		2, 3, 4,
		3, 0, 4,
		0, 1, 2,
		2, 3, 0
		];

		geometry.setIndex(indices);
		geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		geometry.computeVertexNormals();

		const material = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
		return new THREE.Mesh(geometry, material);
	}

	function createThickArrowBetweenPoints(start, end, color = 0xffffaa) {
		const group = new THREE.Group();
		const direction = new THREE.Vector3().subVectors(end, start);
		const length = direction.length();
		const shaftLength = length * 0.9;
		const headLength = length * 0.1;
		const shaftRadius = 0.01;
		const headRadius = 0.015;

		direction.normalize();

		const shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 12);
		const shaftMaterial = new THREE.MeshBasicMaterial({ color });
		const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
		shaft.position.y = shaftLength / 2;
		group.add(shaft);

		const headGeometry = new THREE.ConeGeometry(headRadius, headLength, 12);
		const headMaterial = new THREE.MeshBasicMaterial({ color });
		const head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.y = shaftLength + headLength / 2;
		group.add(head);

		const arrow = new THREE.Group();
		arrow.add(group);
		arrow.position.copy(start);

		const up = new THREE.Vector3(0, 1, 0);
		const quat = new THREE.Quaternion().setFromUnitVectors(up, direction);
		arrow.quaternion.copy(quat);

		return arrow;
	}

	function createImagePlaneBorder(x, y, size, color) {
		const half = size / 2;
		
		const geometry = new THREE.BufferGeometry();
		const vertices = new Float32Array([
			-half,  half, 0,  // top-left
			half,  half, 0,  // top-right
		
			half,  half, 0,  // top-right
			half, -half, 0,  // bottom-right
		
			half, -half, 0,  // bottom-right
			-half, -half, 0,  // bottom-left
		
			-half, -half, 0,  // bottom-left
			-half,  half, 0   // top-left
		]);
		geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		
		const material = new THREE.LineBasicMaterial({ color: color });
		const border = new THREE.LineSegments(geometry, material);
		border.position.set(x, y, 0);
		
		return border;
		}
		
	// --- Project world point with a static camera; return null if outside FOV ---
	function projectWithStaticCamera(worldPos, cam, planeCenter, planeSize = 0.5) {

		// 1. world → clip → NDC
		const ndc = worldPos.clone().project(cam);   // (x,y,z) in NDC space
	
		// 2. discard if point is behind cam or outside view window
		if (ndc.z < 0 || ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1) {
		return null;                               // “don’t draw it”
		}
	
		// 3. NDC → square‑local coords (origin = top‑left)
		const u = (ndc.x + 1) * 0.5 * planeSize;     // 0 … planeSize
		const v = (1 - ndc.y) * 0.5 * planeSize;     // 0 … planeSize
	
		const half = 0.5 * planeSize;
		const topLeft = new THREE.Vector3(
			planeCenter.x - half,                    // left edge in world
			planeCenter.y + half,                    // top  edge in world
			0
		);
	
		return new THREE.Vector3(topLeft.x + u, topLeft.y - v, 0);
	}  
  
	function makeUiDot(col) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(0.01, 12, 12),          // a hair larger
			new THREE.MeshBasicMaterial({
			color: col,
			depthTest: false,    // never hidden by borders
			depthWrite: false
			})
		);
		}	  

	// ---------- dynamic epipolar‑line helper -----------------------------------
	function updateEpipolarLine(line, throughPoint, planeCenter, size, slopeNegative = true) {
		// line eqn  y = m x + b  in plane‑local coords (m = ±1)
		const m = slopeNegative ? -1 : 1;
		
		const local = throughPoint.clone().sub(planeCenter);   // local coords
		const b = local.y - m * local.x;                       // y‑intercept
		
		const h = size / 2;
		// candidate intersections with square edges
		const pts = [];
		// 1. left (x = -h)
		let y = m * (-h) + b;
		if (y >= -h && y <=  h) pts.push(new THREE.Vector3(-h, y, 0));
		// 2. right (x =  h)
		y = m *  h + b;
		if (y >= -h && y <=  h) pts.push(new THREE.Vector3( h, y, 0));
		// 3. bottom (y = -h)
		let x = (-h - b) / m;
		if (x >= -h && x <=  h) pts.push(new THREE.Vector3(x, -h, 0));
		// 4. top (y =  h)
		x = ( h - b) / m;
		if (x >= -h && x <=  h) pts.push(new THREE.Vector3(x,  h, 0));
		
		if (pts.length < 2) return; // should not happen
		
		// keep two farthest points
		if (pts.length > 2) {
			const d01 = pts[0].distanceToSquared(pts[1]);
			const d02 = pts[0].distanceToSquared(pts[2]);
			const d12 = pts[1].distanceToSquared(pts[2]);
			if (d01 <= d02 && d01 <= d12) pts.splice(1,1);       // drop middle
			else if (d02 <= d01 && d02 <= d12) pts.splice(2,1);
			else pts.splice(0,1);
		}
		
		// write into the line’s geometry (already has 2 vertices)
		const pos = line.geometry.attributes.position.array;
		pos[0] = pts[0].x; pos[1] = pts[0].y; pos[2] = 0;
		pos[3] = pts[1].x; pos[4] = pts[1].y; pos[5] = 0;
		line.geometry.attributes.position.needsUpdate = true;
		
		// keep the line attached to its parent square (planeCenter)
	}
	
	const screenPlane1 = createImagePlaneBorder(-aspect + 0.3, 0.7, 0.5, 0x00ff00); // Green
	const screenPlane2 = createImagePlaneBorder(-aspect + 0.3, -0.7, 0.5, 0x0000ff); // Blue
	
	uiScene.add(screenPlane1);
	uiScene.add(screenPlane2);
		
	// -- UI DOTS (slightly larger & in front of UI camera) --
	const uiBlueDotOnGreen = makeUiDot(0x0000ff);
	const uiGreenDotOnBlue = makeUiDot(0x00ff00);

	// NEW: same‑colour dots on their own planes
	const uiGreenDotOnGreen = makeUiDot(0x00ff00);
	const uiBlueDotOnBlue   = makeUiDot(0x0000ff);

	// put every dot a touch in front of the UI camera
	[uiBlueDotOnGreen, uiGreenDotOnBlue, uiGreenDotOnGreen, uiBlueDotOnBlue]
		.forEach(d => d.position.z = -0.01);

	uiScene.add(
		uiBlueDotOnGreen, uiGreenDotOnBlue,
		uiGreenDotOnGreen, uiBlueDotOnBlue
	);


	// -- EPI LINES (empty geometry now, will be filled every frame) --
	function makeEmptyLine(col) {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 0,0,0], 3));
		return new THREE.Line(g, new THREE.LineBasicMaterial({ color: col }));
	}
	const epipLineGreen = makeEmptyLine(0x0000ff); // BLUE   line in green square
	const epipLineBlue  = makeEmptyLine(0x00ff00); // GREEN  line in blue square
	screenPlane1.add(epipLineGreen);
	screenPlane2.add(epipLineBlue);


	// === Shared rotation: face the origin from cam1's position
	const reference = new THREE.Object3D();
	reference.position.set(3, 1, 2); // same as cam1
	reference.lookAt(new THREE.Vector3(0, 0, 0)); // look at the origin
	const sharedRotation = reference.quaternion.clone();

	// === First Camera (gray)
	const cam1 = createCameraPyramid(0.4, 0x888888);
	cam1.position.set(3, 1, 2);
	cam1.quaternion.copy(sharedRotation);
	scene.add(cam1);

	const baseCenter1 = cam1.localToWorld(new THREE.Vector3(0, 0, 0.4));
	const ray1 = createThickArrowBetweenPoints(baseCenter1, new THREE.Vector3(0, 0, 0), 0xffffaa);
	scene.add(ray1);

	// === Dot setup (dynamic position based on cam distance)
	const rayDir1 = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), baseCenter1).normalize();

	const blueDotGeometry = new THREE.SphereGeometry(0.05, 16, 16);
	const blueDotMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
	const blueDot = new THREE.Mesh(blueDotGeometry, blueDotMaterial);
	scene.add(blueDot);

	const greenDotGeometry = new THREE.SphereGeometry(0.05, 16, 16);
	const greenDotMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const greenDot = new THREE.Mesh(greenDotGeometry, greenDotMaterial);
	scene.add(greenDot);


	// === Second Camera (blue)
	const cam2 = createCameraPyramid(0.4, 0x0000ff);
	cam2.position.set(3, 1, 3.18);
	cam2.quaternion.copy(sharedRotation);
	scene.add(cam2);

	// === Third Camera (green)
	const cam3 = createCameraPyramid(0.4, 0x00ff00);
	cam3.position.set(3, 1.75, 2);
	cam3.quaternion.copy(sharedRotation);
	scene.add(cam3);

	/* NEW: “static” cameras that ride on the two pyramids           */
	const staticCamBlue  = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
	const staticCamGreen = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
	staticCamBlue.lookAt(0, 0, 0);
	staticCamGreen.lookAt(0, 0, 0);
	scene.add(staticCamBlue);
	scene.add(staticCamGreen);

	// === Epipolar triangle placeholder
	const triangleGeometry = new THREE.BufferGeometry();
	const triangleVertices = new Float32Array(9); // 3 vertices × 3 components
	triangleGeometry.setAttribute('position', new THREE.BufferAttribute(triangleVertices, 3));
	triangleGeometry.setIndex([0, 1, 2]);
	triangleGeometry.computeVertexNormals();

	const triangleMaterial = new THREE.MeshBasicMaterial({
	color: 0xffcc88, // light orange
	transparent: true,
	opacity: 0.5,
	side: THREE.DoubleSide
	});

	const epipolarTriangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
	scene.add(epipolarTriangle);

	// === Dragging logic for cam2 (Z) and cam3 (Y)
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	let draggingCam2 = false;
	let draggingCam3 = false;
	let prevMouseY = 0;

	viewer.addEventListener('mousedown', (event) => {
		const rect = viewer.getBoundingClientRect();
		mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
		const intersectsCam2 = raycaster.intersectObject(cam2, true);
		const intersectsCam3 = raycaster.intersectObject(cam3, true);

		if (intersectsCam2.length > 0) {
		draggingCam2 = true;
		controls.enabled = false;
		prevMouseY = event.clientY;
		} else if (intersectsCam3.length > 0) {
		draggingCam3 = true;
		controls.enabled = false;
		prevMouseY = event.clientY;
		}
	});

	viewer.addEventListener('mouseup', () => {
		draggingCam2 = false;
		draggingCam3 = false;
		controls.enabled = true;
	});

	viewer.addEventListener('mousemove', (event) => {
		if (draggingCam2) {
		const deltaY = event.clientY - prevMouseY;
		prevMouseY = event.clientY;
		cam2.position.z += deltaY * 0.01;
		cam2.position.z = Math.max(-5, Math.min(5, cam2.position.z));
		cam2.quaternion.copy(sharedRotation);
		}

		if (draggingCam3) {
		const deltaY = event.clientY - prevMouseY;
		prevMouseY = event.clientY;
		cam3.position.y += deltaY * -0.01;
		cam3.position.y = Math.max(-5, Math.min(5, cam3.position.y));
		cam3.quaternion.copy(sharedRotation);
		}
	});

	// ray1 world direction (already built once)
	const rayWorldDir = new THREE.Vector3().subVectors(
		new THREE.Vector3(0, 0, 0),          // target
		baseCenter1                           // ray tail
	).normalize();
	
	function updateStaticCameras() {
		// BLUE static camera on cam2
		cam2.getWorldPosition(staticCamBlue.position);
		staticCamBlue.lookAt(staticCamBlue.position.clone().add(rayWorldDir));
		staticCamBlue.updateMatrixWorld();
	
		// GREEN static camera on cam3
		cam3.getWorldPosition(staticCamGreen.position);
		staticCamGreen.lookAt(staticCamGreen.position.clone().add(rayWorldDir));
		staticCamGreen.updateMatrixWorld();
	}  

	updateStaticCameras();   // initial placement

	function animate() {
		requestAnimationFrame(animate);
		controls.update();

		// === Update epipolar triangle vertices
		const baseGreen = new THREE.Vector3();
		const baseBlue = new THREE.Vector3();
		cam3.getWorldPosition(baseGreen);
		cam2.getWorldPosition(baseBlue);

		const positions = epipolarTriangle.geometry.attributes.position.array;
		positions[0] = baseGreen.x;
		positions[1] = baseGreen.y;
		positions[2] = baseGreen.z;

		positions[3] = baseBlue.x;
		positions[4] = baseBlue.y;
		positions[5] = baseBlue.z;

		positions[6] = greenDot.position.x;
		positions[7] = greenDot.position.y;
		positions[8] = greenDot.position.z;

		epipolarTriangle.geometry.attributes.position.needsUpdate = true;
		epipolarTriangle.geometry.computeVertexNormals();

		// === Update dot positions based on distance from cam1
		const cam1Pos = cam1.getWorldPosition(new THREE.Vector3());
		const cam2Pos = cam2.getWorldPosition(new THREE.Vector3());
		const cam3Pos = cam3.getWorldPosition(new THREE.Vector3());

		const distToCam2 = cam1Pos.distanceTo(cam2Pos);
		const distToCam3 = cam1Pos.distanceTo(cam3Pos);

		blueDot.position.copy(baseCenter1).addScaledVector(rayDir1, distToCam2);
		greenDot.position.copy(baseCenter1).addScaledVector(rayDir1, distToCam3);

		updateStaticCameras(); // ← keeps the two cameras in sync

		const projBlueOnGreen  = projectWithStaticCamera(
			  blueDot.getWorldPosition(new THREE.Vector3()),
			  staticCamGreen,         // ← green photo‑camera
			  screenPlane1.position,
			  0.5
			);
		
		const projGreenOnGreen = projectWithStaticCamera(
				greenDot.getWorldPosition(new THREE.Vector3()),
				staticCamGreen,
				screenPlane1.position,
				0.5
			);
		
		const projGreenOnBlue = projectWithStaticCamera(
			  greenDot.getWorldPosition(new THREE.Vector3()),
			  staticCamBlue,          // ← blue photo‑camera
			  screenPlane2.position,
			  0.5
			);
		const projBlueOnBlue = projectWithStaticCamera(
		  blueDot.getWorldPosition(new THREE.Vector3()),
		  staticCamBlue,
		  screenPlane2.position,
		  0.5
		);

		if (projBlueOnBlue) {
			uiBlueDotOnBlue.visible = true;
			uiBlueDotOnBlue.position.set(projBlueOnBlue.x,
									projBlueOnBlue.y,
									-0.01);
			}
		else{
			uiBlueDotOnBlue.visible = false;
		}

		if(projGreenOnGreen) 
			{
				uiGreenDotOnGreen.visible=true;
				uiGreenDotOnGreen.position.set(projGreenOnGreen.x,
			projGreenOnGreen.y,
			-0.01);}
		else{
			uiGreenDotOnGreen.visible=false;
		}
		
		// 	// project green‑world‑dot into the blue UI square
		if (projGreenOnBlue) {
				uiGreenDotOnBlue.visible = true;
				uiGreenDotOnBlue.position.set(
				projGreenOnBlue.x,
				projGreenOnBlue.y,
				-0.01
			);
		}
		else{
			uiGreenDotOnBlue.visible = false;
		}
	
			// project blue‑world‑dot into the green UI square
		if (projBlueOnGreen) {
				uiBlueDotOnGreen.visible=true;
				uiBlueDotOnGreen.position.set(
				projBlueOnGreen.x,
				projBlueOnGreen.y,
				-0.01         // negative Z  -> in front of the UI camera
			);
		}
		else{
			uiBlueDotOnGreen.visible = false;
		}


			// --------- update epipolar lines so they pass through those dots -----------
			if (projBlueOnGreen) {
				epipLineGreen.visible=true
				updateEpipolarLine(
					epipLineGreen,
					uiBlueDotOnGreen.position,
					screenPlane1.position,
					0.5,           // plane size
					true           // negative slope in green square
				);
			}
			else{
				epipLineGreen.visible=false
			}
			if(projGreenOnBlue){
				epipLineBlue.visible=true
				updateEpipolarLine(
					epipLineBlue,
					uiGreenDotOnBlue.position,
					screenPlane2.position,
					0.5,
					false          // positive slope in blue square
				);
			}
			else{
				epipLineBlue.visible=false
			}

		// Render 3D scene
		renderer.autoClear = true;
		renderer.render(scene, camera);
		
		// Render 2D UI overlay
		renderer.autoClear = false;
		renderer.clearDepth(); // Clear the depth buffer for overlay
		renderer.render(uiScene, uiCamera);
		}
	animate();

	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);

		// --- keep UI ortho camera in‑sync ---
		const a = viewer.clientWidth / viewer.clientHeight;
		uiCamera.left  = -a;
		uiCamera.right =  a;
		uiCamera.updateProjectionMatrix();
	});
});