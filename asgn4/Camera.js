class Camera {
    constructor(move_speed, rotate_speed) {
        this.eye = new Vector3([4, 0, 0]);
        this.at = new Vector3([0, 0, -100]);
        this.up = new Vector3([0, 1, 0]);
        this.move_speed = move_speed;
        this.rotate_speed = rotate_speed;

        this.move = new Float32Array([0, 0, 0]);
        this.rotate = new Float32Array([0, 0, 0]);
    }

    getForward() {
        return (new Vector3()).set(this.at).sub(this.eye).normalize();
    }

    getRight(forward) {
        if (forward === undefined) forward = this.getForward();
        return Vector3.cross(this.getForward(), this.up).normalize();
    }

    update(fps) {
        let new_ms = Math.min(this.move_speed * 60 / fps, this.move_speed * 6);
        let new_rs = Math.min(this.rotate_speed * 60 / fps, this.move_speed * 6);
        if (!new_ms) new_ms = this.move_speed;
        if (!new_rs) new_rs = this.rotate_speed;
        
        let forward = this.getForward();
        let right = this.getRight(forward);

        // Move
        let moveAmount = forward.mul(this.move[2] * new_ms).add(right.mul(this.move[0] * new_ms));
        this.eye.add(moveAmount);
        this.at.add(moveAmount);

        // Rotate (Y-Axis)
        // reset vars
        forward = this.getForward();
        right = this.getRight(forward);
        let distance = (new Vector3()).set(this.at).sub(this.eye).magnitude();

        if (this.rotate[1] !== 0) {
            let direction = right.sub(forward).normalize();
            // set new forward
            forward.add(direction.mul(new_rs * this.rotate[1])).normalize();
            // set new look at direction
            this.at = (new Vector3()).set(this.eye).add(forward.mul(distance));
        }

        // Rotate (X-Axis)
        forward = this.getForward();

        if (this.rotate[0] !== 0) {
            let direction = ((new Vector3()).set(this.up)).sub(forward);
            // set new forward
            forward.add(direction.mul(new_rs * this.rotate[0])).normalize();
            // set new look at direction
            this.at = (new Vector3()).set(this.eye).add(forward.mul(distance));
        }

    }


}