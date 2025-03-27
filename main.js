

var scenes = [
	'05ce34e3cd48c449', '02e6fb86b0172f0b', '03b3f603a1001de0','06a8196a66e125af','02b2358ff02d3ce8', '0090cc64d7b7bb24','00ca5123d8ff6f83'
];
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

// create the viewer here to make it global, and accessible from the HTML
var edge_viewer = null;

document.addEventListener("DOMContentLoaded", function() {
	// create the viewer, and set the initial frame
	edge_viewer = new Sample_viewer('edge',9,scenes);
	edge_viewer.change_frame(0);
	edge_viewer.cycle_frames(100);
});
