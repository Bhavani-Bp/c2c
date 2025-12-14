"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function GalaxyBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true
        });

        renderer.setSize(window.innerWidth, window.innerHeight);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
        camera.position.z = 1;
        camera.rotation.x = Math.PI / 2;

        // Create starfield
        const starsGeometry = new THREE.BufferGeometry();
        const starVertices = [];

        for (let i = 0; i < 10000; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);

            starVertices.push(x, y, z);
        }

        starsGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(starVertices, 3)
        );

        // Star colors - blue and white
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xaaaaff,
            size: 2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const starField = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(starField);

        // Create colorful nebula particles
        const nebulaGeometry = new THREE.BufferGeometry();
        const nebulaVertices = [];
        const nebulaColors = [];

        for (let i = 0; i < 5000; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);

            nebulaVertices.push(x, y, z);

            // Random purple/blue/pink colors
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
                nebulaColors.push(0.6, 0.2, 0.9); // Purple
            } else if (colorChoice < 0.66) {
                nebulaColors.push(0.2, 0.5, 1.0); // Blue
            } else {
                nebulaColors.push(1.0, 0.3, 0.7); // Pink
            }
        }

        nebulaGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(nebulaVertices, 3)
        );
        nebulaGeometry.setAttribute(
            'color',
            new THREE.Float32BufferAttribute(nebulaColors, 3)
        );

        const nebulaMaterial = new THREE.PointsMaterial({
            size: 4,
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        scene.add(nebula);

        // Animation
        let animationId: number;

        function animate() {
            animationId = requestAnimationFrame(animate);

            // Rotate stars slowly
            starField.rotation.z += 0.0002;

            // Rotate nebula slower in opposite direction
            nebula.rotation.z -= 0.0001;

            // Move camera slowly for parallax effect
            camera.position.x = Math.sin(Date.now() * 0.0001) * 0.5;
            camera.position.y = Math.cos(Date.now() * 0.00015) * 0.5;

            renderer.render(scene, camera);
        }
        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationId);
            starsGeometry.dispose();
            starsMaterial.dispose();
            nebulaGeometry.dispose();
            nebulaMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 1,
                pointerEvents: "none",
            }}
        />
    );
}
