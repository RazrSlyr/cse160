// General animation stats
let fps = 60;
let animating = true;
let start = undefined;
let previousTimestamp = undefined;

// Arm animation stats
let baseArmRotationSpeed = 0.06;
let armRotationLimit = 15;
let elbowRotationLimit = 30;
let fingerRotationLimit = 60;

let leftShoulderGoingDown = true;
let leftElbowGoingDown = true;

let rightShoulderGoingDown = false;
let rightElbowGoingDown = false;

// Finger animation stats
let baseFingerRotationSpeed = 0.12;
let leftFingersGoingUp = [Math.random() > 5, Math.random() > 5, Math.random() > 5];
let rightFingersGoingUp = [Math.random() > 5, Math.random() > 5, Math.random() > 5];

// Leg animation stats
let baseRunSpeed = 0.12;
let hipRotationLimit = 45;
let kneeRotationLimit = 90;

// Right Leg
let rightLegGoingForward = true;
let rightKneeGoingForward = true;

// Left Leg
let leftLegGoingForward = false;
let leftKneeGoingForward = false;

// Arm Dimensions
let armWidth = 0.45;
let armHeight = 0.15;

// Arm Angles
let rightArmAngles = {
    shoulder: 0,
    elbow: {
        x: 0,
        y: 0,
        z: 0,
    },
    fingers: [Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30]
};

let leftArmAngles = {
    shoulder: 0,
    elbow: {
        x: 0,
        y: 0,
        z: 0,
    },
    fingers: [Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30]
};

// Leg Dimenions
let legWidth = 0.15;
let legDepth = 0.15;
let legHeight = 0.3;

// Leg Angles
let leftLegAngles = {
    hip: 0,
    knee: -45,
}

let rightLegAngles = {
    hip: 0,
    knee: -45,
}

// Claw/Finger Dimensions
let clawHeight = armHeight / 2;
let clawWidth = 0.04;
let clawDepth = 0.09;

// Body Dimensions
let bodyWidth = 0.4;
let bodyHeight = 0.6;
let bodyDepth = 0.5;

// Head Angle
let headAngle = 0;

// Colors
let bodyPurple = [51 / 255, 51 / 255, 204 / 255, 1];
let eye = [179 / 255, 224 / 255, 246, 255];
let centerGem = [202 / 255, 34 / 255, 30 / 255, 1];
let blueGem = [18 / 255, 176 / 255, 227 / 255, 1];
let darkerBlueGem = []

// Camera Control (via mouse)
let prevMouseX = undefined;
let prevMouseY = undefined;
let mouseCameraSpeed = 0.5;

// Vars for the Poke Animation
let baseShoulderSpeed = 2.4;
let baseElbowSpeed = 4.8;
let baseHeadSpeed = 4.8;
let baseKneeSpeed = 2.4;
let baseWaveSpeed = 5;

let raisedShoulder = false;
let raisedElbow = false;
let tiltedElbow = false;
let tiltedHead = false;
let stretchedKnee = false;
let waving = false;
let wavedRight = false;
let wavedLeft = false;
let doneWaving = false;
let shiftPressed = false;


class Sableye {

    constructor(matrix) {
        this.matrix = matrix;
        if (matrix === undefined) this.matrix = new Matrix4();
        this.shapesList = null;
    }

    addBody() {
        let M = new Matrix4(this.matrix);
        M.scale(bodyWidth, bodyHeight, bodyDepth);
        this.shapesList.push(new Cube(bodyPurple, M));
    }

    addLeftArm() {
        let M = new Matrix4(this.matrix);

        // First half (connecting to body)
        M.translate(bodyWidth / 2 - armWidth * .25, 0, 0);
        M.rotate(leftArmAngles.shoulder, 0, 0, 1);
        M.translate(armWidth / 2, 0, 0);
        let M2 = new Matrix4(M);
        M.scale(armWidth * 1.25, armHeight, 0.15);
        this.shapesList.push(new Cube(bodyPurple, M));


        // Second half (connecting to elbow)
        // Translate further to where this needs to be
        M2.translate(armWidth * 1.25 / 2, 0, 0);
        // Rotate
        M2.rotate(leftArmAngles.elbow.z, 0, 0, 1);
        M2.rotate(leftArmAngles.elbow.y, 0, 1, 0);
        M2.rotate(leftArmAngles.elbow.x, 1, 0, 0);
        // Go to pivot point
        M2.translate(0, 0, -armWidth / 2 + 0.15 / 2);
        // Save state
        let M3 = new Matrix4(M2);
        M2.scale(armHeight, armHeight + 0.01, armWidth + 0.01);
        this.shapesList.push(new Cube(bodyPurple, M2));

        // Left Claws
        // Claw 1
        // Move to new location
        let M4 = new Matrix4(M3);
        M3.translate(0, armHeight / 2 - clawHeight / 2,
            -armWidth / 2 + clawDepth / 1.75);
        // Rotate
        M3.rotate(leftArmAngles.fingers[0], 1, 0, 0);
        // Move claw to pivot point
        M3.translate(0, 0, - clawDepth);
        // Scale
        M3.scale(clawWidth, clawHeight, clawDepth);
        this.shapesList.push(new Cube(bodyPurple, M3));


        // Claw 2
        M3 = new Matrix4(M4);
        M3.translate(-armHeight / 2 + clawWidth / 2,
            armHeight / 2 - clawHeight / 2,
            -armWidth / 2 + clawDepth / 1.75);
        // Rotate
        M3.rotate(leftArmAngles.fingers[1], 1, 0, 0);
        // Move claw to pivot point
        M3.translate(0, 0, - clawDepth);
        // Scale
        M3.scale(clawWidth, clawHeight, clawDepth);
        this.shapesList.push(new Cube(bodyPurple, M3));

        // Claw 3
        M3 = new Matrix4(M4);
        M3.translate(armHeight / 2 - clawWidth / 2,
            armHeight / 2 - clawHeight / 2,
            -armWidth / 2 + clawDepth / 1.75);
        // Rotate
        M3.rotate(leftArmAngles.fingers[2], 1, 0, 0);
        // Move claw to pivot point
        M3.translate(0, 0, - clawDepth);
        // Scale
        M3.scale(clawWidth, clawHeight, clawDepth);
        this.shapesList.push(new Cube(bodyPurple, M3));

    }

    addRightArm() {
        let M = new Matrix4(this.matrix);

        // First half (connecting to body)
        M.translate(-bodyWidth / 2 + armWidth * .25, 0, 0);
        M.rotate(rightArmAngles.shoulder, 0, 0, 1);
        M.translate(-armWidth / 2, 0, 0);
        let M2 = new Matrix4(M);
        M.scale(armWidth * 1.25, armHeight, 0.15);
        this.shapesList.push(new Cube(bodyPurple, M));


        // Second half (connecting to elbow)
        // Translate further to where this needs to be
        M2.translate(-armWidth * 1.25 / 2, 0, 0);
        // Rotate
        M2.rotate(rightArmAngles.elbow.z, 0, 0, 1);
        M2.rotate(rightArmAngles.elbow.y, 0, 1, 0);
        M2.rotate(rightArmAngles.elbow.x, 1, 0, 0);
        // Go to pivot point
        M2.translate(0, 0, -armWidth / 2 + 0.15 / 2);
        // Save state
        let M3 = new Matrix4(M2);
        M2.scale(armHeight, armHeight + 0.01, armWidth + 0.01);
        this.shapesList.push(new Cube(bodyPurple, M2));

        // Left Claws
        // Claw 1
        // Move to new location
        let M4 = new Matrix4(M3);
        M3.translate(0, armHeight / 2 - clawHeight / 2,
            -armWidth / 2 + clawDepth / 1.75);
        // Rotate
        M3.rotate(rightArmAngles.fingers[0], 1, 0, 0);
        // Move claw to pivot point
        M3.translate(0, 0, - clawDepth);
        // Scale
        M3.scale(clawWidth, clawHeight, clawDepth);
        this.shapesList.push(new Cube(bodyPurple, M3));


        // Claw 2
        M3 = new Matrix4(M4);
        M3.translate(armHeight / 2 - clawWidth / 2,
            armHeight / 2 - clawHeight / 2,
            -armWidth / 2 + clawDepth / 1.75);
        // Rotate
        M3.rotate(rightArmAngles.fingers[1], 1, 0, 0);
        // Move claw to pivot point
        M3.translate(0, 0, - clawDepth);
        // Scale
        M3.scale(clawWidth, clawHeight, clawDepth);
        this.shapesList.push(new Cube(bodyPurple, M3));

        // Claw 3
        M3 = new Matrix4(M4);
        M3.translate(-armHeight / 2 + clawWidth / 2,
            armHeight / 2 - clawHeight / 2,
            -armWidth / 2 + clawDepth / 1.75);
        // Rotate
        M3.rotate(rightArmAngles.fingers[2], 1, 0, 0);
        // Move claw to pivot point
        M3.translate(0, 0, - clawDepth);
        // Scale
        M3.scale(clawWidth, clawHeight, clawDepth);
        this.shapesList.push(new Cube(bodyPurple, M3));

    }

    addCenterGem() {
        let n_sides = 6;
        let angle = 90;
        let points = [];
        let inc = 360 / (n_sides);
        for (let i = 0; i < n_sides; i++) {
            let z = Math.sin(angle / 180 * Math.PI) * 0.5;
            let x = Math.cos(angle / 180 * Math.PI) * 0.5;
            let point = new Point3D(x, 0, z);
            points.push(point);
            angle += inc;
        }
        let M = new Matrix4(this.matrix);
        M.translate(0, 0, -bodyWidth / 2 - 0.05);
        M.scale(0.15, 0.25, 0.02);
        M.rotate(90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, centerGem, M));

    }

    addBackGems() {
        let n_sides = 6;
        let angle = 90;
        let points = [];
        let inc = 360 / (n_sides);
        for (let i = 0; i < n_sides; i++) {
            let z = Math.sin(angle / 180 * Math.PI) * 0.5;
            let x = Math.cos(angle / 180 * Math.PI) * 0.5;
            let point = new Point3D(x, 0, z);
            points.push(point);
            angle += inc;
        }
        let M = new Matrix4(this.matrix);
        M.translate(bodyWidth / 5, bodyHeight / 5, bodyWidth / 2 + 0.05);
        M.scale(0.15, 0.15, 0.02);
        M.rotate(90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, centerGem, M));

        M = new Matrix4(this.matrix);
        M.translate(-bodyWidth / 5, 0, bodyWidth / 2 + 0.05);
        M.scale(0.07, 0.15, 0.02);
        M.rotate(20, 0, 0, 1);
        M.rotate(90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, blueGem, M));

        M = new Matrix4(this.matrix);
        M.translate(bodyWidth / 8, -bodyHeight / 5, bodyWidth / 2 + 0.05);
        M.scale(0.15, 0.07, 0.02);
        M.rotate(20, 0, 0, 1);
        M.rotate(90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, blueGem, M));

    }

    addLeftLeg() {
        let M = new Matrix4(this.matrix);
        // Top half
        M.rotate(leftLegAngles.hip, 1, 0, 0);
        M.translate(bodyWidth / 2 - legWidth / 2 - 0.01, -bodyHeight / 2 - legHeight / 2, 0);
        let M2 = new Matrix4(M);
        M.scale(legWidth, legHeight, legDepth);
        this.shapesList.push(new Cube(bodyPurple, M));

        // Bottom Half
        M = new Matrix4(M2);

        M.translate(0, -legHeight / 2, 0);
        M.rotate(leftLegAngles.knee, 1, 0, 0);
        M.translate(0, -legHeight / 2 + 0.074, 0);
        M.scale(legWidth, legHeight, legDepth);
        this.shapesList.push(new Cube(bodyPurple, M));
    }

    addRightLeg() {
        let M = new Matrix4(this.matrix);
        // Top half
        M.rotate(rightLegAngles.hip, 1, 0, 0);
        M.translate(-bodyWidth / 2 + legWidth / 2 + 0.01, -bodyHeight / 2 - legHeight / 2, 0);
        let M2 = new Matrix4(M);
        M.scale(legWidth, legHeight, legDepth);
        this.shapesList.push(new Cube(bodyPurple, M));

        // Bottom Half
        M = new Matrix4(M2);

        M.translate(0, -legHeight / 2, 0);
        M.rotate(rightLegAngles.knee, 1, 0, 0);
        M.translate(0, -legHeight / 2 + 0.074, 0);
        M.scale(legWidth, legHeight, legDepth);
        this.shapesList.push(new Cube(bodyPurple, M));
    }

    addEyes(M) {
        // Right Eye
        let n_sides = 6;
        let angle = 90;
        let points = [];
        let inc = 360 / (n_sides);
        for (let i = 0; i < n_sides; i++) {
            let z = Math.sin(angle / 180 * Math.PI) * 0.5;
            let x = Math.cos(angle / 180 * Math.PI) * 0.5;
            let point = new Point3D(x, 0, z);
            points.push(point);
            angle += inc;
        }

        if (M == undefined) M = new Matrix4(this.matrix);
        let M2 = new Matrix4(M);
        M2.translate(0.175, 0, -0.15);
        M2.rotate(90, 1, 0, 0);
        M2.scale(0.25, 0.25, 0.22);

        this.shapesList.push(new Prism(points, 1, eye, M2));


        // Left Eye
        M2 = new Matrix4(M);
        M2.translate(-0.175, 0, -0.15);
        M2.rotate(90, 1, 0, 0);
        M2.scale(0.25, 0.25, 0.22);

        this.shapesList.push(new Prism(points, 1, eye, M2));
    }

    addEars(M) {
        // Right Ear
        let points = [
            new Point3D(-0.5, 0, -0.5),
            new Point3D(0.5, 0, -0.5),
            new Point3D(-0.5, 0, 0.5)
        ];

        if (M == undefined) M = new Matrix4(this.matrix);
        let M2 = new Matrix4(M);
        M2.translate(-0.2, (0.75 * 0.8) / 2, 0);
        M2.scale(0.25, 0.25, bodyDepth);
        M2.rotate(-90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, bodyPurple, M2));

        M2 = new Matrix4(M);
        M2.translate(-0.3, -0.03 + (0.75 * 0.8) / 2, 0);
        M2.scale(0.25, 0.25, bodyDepth);
        M2.rotate(30, 0, 0, 1);
        M2.rotate(-90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, bodyPurple, M2));

        // Left Ear
        M2 = new Matrix4(M);
        M2.translate(0.2, (0.75 * 0.8) / 2, -0.005);
        M2.scale(-0.25, 0.25, bodyDepth);
        M2.rotate(-90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, bodyPurple, M2));

        M2 = new Matrix4(M);
        M2.translate(0.3, -0.03 + (0.75 * 0.8) / 2, -0.005);
        M2.scale(-0.25, 0.25, bodyDepth);
        M2.rotate(30, 0, 0, 1);
        M2.rotate(-90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, bodyPurple, M2));

    }

    addHead() {
        let n_sides = 6;
        let angle = 90;
        let points = [];
        let inc = 360 / (n_sides);
        for (let i = 0; i < n_sides; i++) {
            let z = Math.sin(angle / 180 * Math.PI) * 0.5;
            let x = Math.cos(angle / 180 * Math.PI) * 0.5;
            let point = new Point3D(x, 0, z);
            points.push(point);
            angle += inc;
        }
        let M = new Matrix4(this.matrix);
        M.translate(0, bodyHeight - 0.1, 0);
        M.rotate(headAngle, 0, 0, 1);
        let M2 = new Matrix4(M);
        M.scale(0.8, 0.75 * 0.8, bodyDepth + 0.01);
        M.rotate(-90, 1, 0, 0);
        this.shapesList.push(new Prism(points, 1, bodyPurple, M));

        this.addEyes(M2);
        this.addEars(M2);
    }



    render() {
        if (this.shapesList === null) {
            this.shapesList = [];
            this.addBody();
            this.addLeftArm();
            this.addRightArm();
            this.addCenterGem();
            this.addLeftLeg();
            this.addRightLeg();
            this.addHead();
            this.addBackGems();
        }
        for (let i = 0; i < this.shapesList.length; i++) {
            let shape = this.shapesList[i];
            shape.render();
        }
    }
}