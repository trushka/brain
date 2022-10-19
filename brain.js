const canvas = document.querySelector('.brain-animation canvas');

import * as THREE from 'three';
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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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

const
	renderer = new WebGLRenderer( {alpha:true, antialias: true, canvas:canvas } ),
	camera = new PerspectiveCamera( 25, 1, 10, 20000 ),
	bMaterial = new MeshStandardMaterial({
		color: '#a19c0c',//fff838',
		roughness: .3,
		metalness: 1,
		opacity: 0.5,
		side: 2,
		transparent: true,
		premultipliedAlpha: true,
	}),
	lights = [new DirectionalLight(), new DirectionalLight(), new DirectionalLight()],
	//Mesh(bGeometry, bMaterial),
	scene = new Scene().add(...lights);//.add(brain, brain.clone());

let size, ratio, brain, bGeometry;

new GLTFLoader().load('brain.glb', (obj)=>{
		console.log(obj)
	scene.add(brain = obj.scene)
	.traverse(el=>{
		if (!el.isMesh) return;
		el.material = bMaterial;
		if (!bGeometry) bGeometry = el.geometry.smooth();
	})
})

camera.position.z=200;
lights.forEach((light, i)=>light.position.set((i-=1)*12, 7+!i*5, 12));
renderer.outputEncoding = 3001;

requestAnimationFrame(function anim(){
	requestAnimationFrame(anim);

	const box = canvas.getBoundingClientRect();
	if (box.bottom < 0 || box.top > innerHeight || !brain) return;

	if (size != box.width || ratio != devicePixelRatio)
	 renderer.setDrawingBufferSize(size=box.width, size, ratio=devicePixelRatio);

	renderer.render(scene, camera);
	brain.rotation.y += .001
})
Object.assign(window, {renderer, camera, bGeometry, bMaterial, brain, scene})
//console.log(bGeometry)