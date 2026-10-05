export declare const physicsProfiles: Readonly<{
    vehicle: Readonly<{
        maxWheels: 16;
        spring: 30000;
        damping: 4500;
        friction: 1;
        maxForce: 100000;
        driveForce: 4000;
        brakeForce: 8000;
        lateralGrip: 12;
    }>;
    ragdoll: Readonly<{
        maxBones: 128;
        referenceTolerance: 0.001;
    }>;
    softBody: Readonly<{
        maxParticles: 4096;
        maxSprings: 32768;
        fixedDelta: number;
        maxSubSteps: 64;
        stiffness: 100;
        damping: 2;
        drag: 1;
        radius: 0.025;
        iterations: 4;
        maxStretch: 1.2;
    }>;
    debug: Readonly<{
        circleSegments: 24;
        maxSegments: 100000;
        width: 0.015;
        normalLength: 0.25;
        planeExtent: 5;
    }>;
}>;
