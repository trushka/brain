const animEl = document.querySelector('.brain-animation');
console.log('module');

//import * as THREE from 'three';
import * as THREE from './three.js';
import { GLTFLoader } from './GLTFLoader.js'; //three/addons/loaders
 
console.log(GLTFLoader, THREE);
const {
	Vector2,
	Vector3,
	MathUtils,
	Quaternion,
	WebGLRenderer,
	Scene,
	Group,
	PerspectiveCamera,
	Mesh,
	MeshStandardMaterial,
	RawShaderMaterial,
	TextureLoader,
	Color,
	IcosahedronGeometry,
	//Points,
	Float32BufferAttribute,
	PointsMaterial,
	BufferGeometry,
	BufferAttribute,
	Fog,
	Raycaster,
	BufferGeometryLoader,
	DirectionalLight
} = THREE;
//import BrainJSON from './brain.json.js';

function vec3(...args) {return new Vector3(...args)};
const Math = Object.assign({__proto__: window.Math}, MathUtils);

BufferGeometry.prototype.smooth = function () {

	var index = this.index;
	var attributes = this.attributes;

	if ( attributes.position ) {

		if ( index ) {

			var positions = attributes.position.array;

			if ( attributes.normal === undefined ) {

				this.setAttribute( 'normal', new BufferAttribute( new Float32Array( positions.length ), 3 ) );

			} else {

				// reset existing normals to zero

				var array = attributes.normal.array;

				for ( var i = 0, il = array.length; i < il; i ++ ) {

					array[ i ] = 0;

				}

			}

			var normals = attributes.normal.array;
			var indices = index.array;

			var vA, vB, vC,  a, b, c;
			var pA = vec3(), pB = vec3(), pC = vec3();
			var cb = vec3(), ab = vec3(), ac = vec3();

			indices.forEach (function( el, i ) {
				if (i%3) return;

				vA = indices[ i     ] * 3;
				vB = indices[ i + 1 ] * 3;
				vC = indices[ i + 2 ] * 3;

				pA.fromArray( positions, vA );
				pB.fromArray( positions, vB );
				pC.fromArray( positions, vC );

				cb.subVectors( pC, pB );
				ab.subVectors( pA, pB );
				ac.subVectors( pA, pC );

				a=ab.angleTo(ac);
				b=ab.angleTo(cb);
				c=Math.PI-a-b;

				cb.cross( ab );

				normals[ vA ] +=cb.x*a;
				normals[ vA + 1 ] += cb.y*a;
				normals[ vA + 2 ] += cb.z*a;

				normals[ vB ] += cb.x*b;
				normals[ vB + 1 ] += cb.y*b;
				normals[ vB + 2 ] += cb.z*b;

				normals[ vC ] += cb.x*c;
				normals[ vC + 1 ] += cb.y*c;
				normals[ vC + 2 ] += cb.z*c;

			})

			this.normalizeNormals();

			attributes.normal.needsUpdate = true;

		} else {
			console.warn('indexed only!');
			this.computeVertexNormals()
		}
	}
	return this;
}

function rnd(min=0, max=1) {
	if (min>max) [min, max] = [max, min];
	return min + Math.random() * (max-min)
}

const
	PI=Math.PI, PIx2= PI*2,
	renderer = new WebGLRenderer( {alpha:true, antialias: true } ),
	canvas = renderer.domElement,
	camera = new PerspectiveCamera( 25, 1, 10, 20000 ),
	bMaterial = new MeshStandardMaterial({
		color: '#a19c0c',//fff838',#e9e220',//
		roughness: .3,
		metalness: 1,
		opacity: 0.33,
		side: 2,
		transparent: true,
		premultipliedAlpha: true,
		onBeforeCompile: sh=>{
			sh.uniforms.o2={get value(){return bMaterial.o2}};
			//sh.
		}
	}),
	light = new THREE.PointLight(),
	lights = [new DirectionalLight(), new DirectionalLight(), new DirectionalLight()],
	//Mesh(bGeometry, bMaterial),
	scene = new Scene().add(...lights),//.add(brain, brain.clone());
	words = animEl.dataset.words.replace(/^\s+|,*\s+$/g, '').split(/,\s*/),
	$words=[], count=16,
	rotator=new THREE.Euler(0,0,0);

let size, ratio, brain, bGeometry, t0=0;

//animEl.innerText='';
animEl.append(canvas);
new GLTFLoader().load('brain.glb', (obj)=>{
	scene.add(brain = obj.scene)
	.traverse(el=>{
		if (!el.isMesh) return;
		el.material = bMaterial;
		if (!bGeometry) bGeometry = el.geometry.smooth();
	})

	//brain.add(light);
})

Vector3.prototype.rotate=function(...args){
	return this.applyEuler(rotator.set(...args))
}

function setEl(el){
	var i = el._i,
		rz=(Math.smootherstep(rnd(), 0, 1)-.5)*.4*PI,
		isActive = el._active = !(i%3-1), word,
		rx = rnd(0, PIx2) * !isActive,
		index=Math.floor(rnd(0, 4));

	//rz*=1-Math.abs(Math.sin(rx)*.2);

	el._rot=new THREE.Euler(rx, 0, rz).reorder('YZX');

	el._phase = -PI;

	word=words.splice(index, 1)[0];
	el.innerText=word;
	if (isActive) words.push(word)
	else words.splice(-1, 0, word)
}

words.sort(a=>rnd(-1, 1));

for (let i=0; i<count; i++) {

	const el = $words[i] = document.createElement('span');

	el._i=i;

	setEl(el);

	el._phase = PI - PIx2 / count * i;

	animEl.append(el);
}

console.log($words.map(e=>e.innerText)) 

camera.position.z=200;
light.position.set(8.62, .06, 20.5);
lights.forEach((light, i)=>light.position.set((i-=1)*12, 7+!i*5, 12));
renderer.outputEncoding = THREE.GammaEncoding//3001;
//renderer.gammaFactor=1.8

requestAnimationFrame(function anim(t){
	requestAnimationFrame(anim);

	const box = canvas.getBoundingClientRect();
	if (box.bottom < 0 || box.top > innerHeight || !brain || window.stoped ) return;

	if (size != box.width || ratio != devicePixelRatio) {
		renderer.setDrawingBufferSize(size=box.width, size, ratio=devicePixelRatio);
		brain.rotation.y = PI/2;
		renderer.render(scene, camera)
	}

	const dt = Math.min((t - t0) / (1000/60), 3),
		start=.5, l=size*.45;
	t0 = t;

	$words.forEach((el, i)=>{
		const 
			ph=el._phase += .0012*dt,
			abs= Math.max(Math.abs(ph)-.07, 0),
			pos=vec3(0, 0, l);

		if (ph > PI) setEl(el, el._i+=count);

		el._rot._x = -ph;
		pos.applyEuler(el._rot);

		if (el._active) {
			pos.lerp(vec3(0, 0, l*1.6), 5**-(abs**1.9*5));
			if (ph>-.19) el.classList.add('highlighted');
			if (ph>.13) el.classList.remove('highlighted');
		}

		el.style.transform=`translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) scale(.5)`;
		el.style.zIndex=Math.sign(pos.z);
		el.style.opacity=Math.cos(ph)*.6+.6;

	})
	renderer.render(scene, camera);
	brain.rotation.y += .001*dt
})
Object.assign(window, {renderer, camera, bGeometry, bMaterial, brain, scene, THREE, lights, animEl, $words, vec3, rnd})
//console.log(bGeometry)