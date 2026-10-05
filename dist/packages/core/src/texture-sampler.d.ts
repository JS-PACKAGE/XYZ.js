export interface TextureSamplerOptions {
    minFilter?: 'nearest' | 'linear';
    magFilter?: 'nearest' | 'linear';
    mipmapFilter?: 'nearest' | 'linear';
    lodMinClamp?: number;
    lodMaxClamp?: number;
    addressModeU?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
    addressModeV?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
    /** Integer quality request in [1,16]; the platform may use a lower value. */
    maxAnisotropy?: number;
}
export declare function validateAnisotropy(value: TextureSamplerOptions): void;
export declare function samplerOptions(value: TextureSamplerOptions | undefined): Readonly<TextureSamplerOptions> | undefined;
