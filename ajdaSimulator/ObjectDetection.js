import { vec3 } from 'glm';
import { getGlobalModelMatrix } from 'engine/core/SceneUtils.js';

export class ObjectDetection {
    constructor(scene) {
        this.scene = scene; // Referenca na trenutno sceno
    }

    getTransformedAABB(node) {
        const matrix = getGlobalModelMatrix(node);
        const { min, max } = node.aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));

        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        const zs = vertices.map(v => v[2]);
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }

    rayAABBIntersection(rayOrigin, rayDirection, aabb) {
        let tmin = (aabb.min[0] - rayOrigin[0]) / rayDirection[0];
        let tmax = (aabb.max[0] - rayOrigin[0]) / rayDirection[0];

        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

        let tymin = (aabb.min[1] - rayOrigin[1]) / rayDirection[1];
        let tymax = (aabb.max[1] - rayOrigin[1]) / rayDirection[1];

        if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

        if ((tmin > tymax) || (tymin > tmax)) return false;

        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;

        let tzmin = (aabb.min[2] - rayOrigin[2]) / rayDirection[2];
        let tzmax = (aabb.max[2] - rayOrigin[2]) / rayDirection[2];

        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

        if ((tmin > tzmax) || (tzmin > tmax)) return false;

        return true;
    }

    getObjectInView(cameraPosition, cameraDirection) {
        let closestObject = null;
        let closestDistance = 43;

        // Flatten the ray on the Y-axis
        const flatRayOrigin = vec3.fromValues(cameraPosition[0], 0, cameraPosition[2]);
        const flatRayDirection = vec3.fromValues(cameraDirection[0], 0, cameraDirection[2]);
    
        this.scene.traverse(node => {
            if (node.aabb) {
                const aabb = this.getTransformedAABB(node);
    
                // Flatten the AABB on the Y-axis
                const flatAABB = {
                    min: [aabb.min[0], 0, aabb.min[2]],
                    max: [aabb.max[0], 0, aabb.max[2]],
                };
    
                // Check for intersection with the flattened ray and AABB
                if (this.rayAABBIntersection(flatRayOrigin, flatRayDirection, flatAABB)) {
                    // Calculate center and distance in the XZ-plane
                    const center = vec3.fromValues(
                        (flatAABB.min[0] + flatAABB.max[0]) / 2,
                        0,
                        (flatAABB.min[2] + flatAABB.max[2]) / 2
                    );
    
                    const distance = vec3.distance(flatRayOrigin, center);
    
                    if (distance < closestDistance) {
                        if (!(node.camera || node.name === "Camera")) {
                            closestDistance = distance;
                            closestObject = node;
                        }
                    }
                }
            }
        });
    
        if (closestObject) {
            //console.log(closestObject.name);
            //console.log(closestObject);
        }
        return closestObject;
    }
    
}
