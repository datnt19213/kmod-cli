export type SegmentsNumberProps = {
    percent?: number;
    segmentsCount?: number;
}
/**
 * Calculate the number of segments required for a progress circle.
 * @param {{percent?: number; segmentsCount?: number;}} [props] - Optional props for calculation.
 * @param {number} [props.percent=90] - The percentage of circle to be taken up by the progress.
 * @param {number} [props.segmentsCount=10] - The number of segments to use in the circle.
 * @returns {number} The number of segments required.
 */
export const segmentsNumber = ({percent, segmentsCount}: SegmentsNumberProps): number => {
    if(!percent || !segmentsCount) {
        return 0 
    }
    const segments = (segmentsCount * (percent / 100) * segmentsCount).toFixed(0)
    return Number(segments);
}