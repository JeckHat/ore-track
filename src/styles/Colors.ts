export const baseBg = '#0F0E11'
export const baseComponent = '#131216'
export const primary = '#F5F5F5'
export const primaryHover = '#FAFAFA'
export const gold = '#ECC771'
export const lowEmphasis = '#707070'

export function opacityColor(color: string, value: number){
    const opacity = Math.floor(0.1 * value * 255).toString(16);
    return color + opacity;
}