const ip = require('ip');
const { Netmask } = require('netmask');

class IPUtils {
    /**
     * 验证IP地址格式
     * @param {string} ipAddress - IP地址
     * @returns {boolean} 是否为有效IP
     */
    static isValidIP(ipAddress) {
        try {
            return ip.isV4Format(ipAddress) || ip.isV6Format(ipAddress);
        } catch (e) {
            return false;
        }
    }

    /**
     * 验证CIDR格式
     * @param {string} cidr - CIDR格式的IP段
     * @returns {boolean} 是否为有效CIDR
     */
    static isValidCIDR(cidr) {
        try {
            new Netmask(cidr);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 解析IP段信息
     * @param {string} ipAddress - IP地址
     * @param {string} subnetMask - 子网掩码
     * @returns {object} IP段信息
     */
    static parseIPInfo(ipAddress, subnetMask) {
        try {
            // 确保子网掩码格式正确
            let mask = subnetMask;
            if (!mask.startsWith('/')) {
                mask = '/' + mask;
            }
            
            const block = new Netmask(`${ipAddress}${mask}`);
            return {
                network: block.base,
                broadcast: block.broadcast,
                first: block.first,
                last: block.last,
                size: block.size,
                bitmask: block.bitmask,
                hostmask: block.hostmask
            };
        } catch (e) {
            console.error('IP解析错误:', e.message);
            throw new Error(`无效的IP地址或子网掩码: ${e.message}`);
        }
    }

    /**
     * 分割IP段
     * @param {string} parentCIDR - 父IP段
     * @param {number} splitCount - 分割数量
     * @returns {Array} 分割后的子网段
     */
    static splitIPRange(parentCIDR, splitCount) {
        try {
            const parentBlock = new Netmask(parentCIDR);
            const subnets = [];
            
            // 计算需要的位数
            const requiredBits = Math.ceil(Math.log2(splitCount));
            const newPrefix = parentBlock.bitmask + requiredBits;
            
            if (newPrefix > 32) {
                throw new Error('分割数量过大，无法分割');
            }

            // 生成子网
            const subnetSize = Math.pow(2, 32 - newPrefix);
            const networkLong = ip.toLong(parentBlock.base);
            
            for (let i = 0; i < splitCount; i++) {
                const subnetNetwork = ip.fromLong(networkLong + (i * subnetSize));
                const subnet = new Netmask(`${subnetNetwork}/${newPrefix}`);
                subnets.push({
                    cidr: subnet.toString(),
                    network: subnet.base,
                    broadcast: subnet.broadcast,
                    size: subnet.size,
                    bitmask: subnet.bitmask
                });
            }

            return subnets;
        } catch (e) {
            throw new Error(`分割IP段失败: ${e.message}`);
        }
    }

    /**
     * 合并IP段
     * @param {Array} ipRanges - 要合并的IP段数组
     * @returns {Array} 合并后的IP段
     */
    static mergeIPRanges(ipRanges) {
        try {
            if (!Array.isArray(ipRanges) || ipRanges.length === 0) {
                throw new Error('IP段数组不能为空');
            }

            // 验证所有IP段
            const validRanges = ipRanges.map(range => {
                if (typeof range === 'string') {
                    return new Netmask(range);
                }
                throw new Error('IP段格式无效');
            });

            // 按网络地址排序
            validRanges.sort((a, b) => ip.toLong(a.network) - ip.toLong(b.network));

            const merged = [];
            let current = validRanges[0];

            for (let i = 1; i < validRanges.length; i++) {
                const next = validRanges[i];
                
                // 检查是否可以合并（相邻且相同前缀长度）
                if (current.bitmask === next.bitmask && 
                    ip.toLong(next.network) === ip.toLong(current.broadcast) + 1) {
                    
                    // 尝试合并
                    const mergedPrefix = current.bitmask - 1;
                    if (mergedPrefix >= 0) {
                        const mergedBlock = new Netmask(`${current.network}/${mergedPrefix}`);
                        if (mergedBlock.contains(next.network) && mergedBlock.contains(next.broadcast)) {
                            current = mergedBlock;
                            continue;
                        }
                    }
                }
                
                merged.push(current);
                current = next;
            }
            
            merged.push(current);
            return merged.map(block => ({
                cidr: block.toString(),
                network: block.network,
                broadcast: block.broadcast,
                size: block.size,
                bitmask: block.bitmask
            }));
        } catch (e) {
            throw new Error(`合并IP段失败: ${e.message}`);
        }
    }

    /**
     * 检查IP段是否重叠
     * @param {string} cidr1 - 第一个IP段
     * @param {string} cidr2 - 第二个IP段
     * @returns {boolean} 是否重叠
     */
    static isOverlapping(cidr1, cidr2) {
        try {
            const block1 = new Netmask(cidr1);
            const block2 = new Netmask(cidr2);
            
            return block1.contains(block2.network) || 
                   block1.contains(block2.broadcast) ||
                   block2.contains(block1.network) || 
                   block2.contains(block1.broadcast);
        } catch (e) {
            return false;
        }
    }

    /**
     * 获取IP段的详细信息
     * @param {string} cidr - CIDR格式的IP段
     * @returns {object} IP段详细信息
     */
    static getIPRangeDetails(cidr) {
        try {
            const block = new Netmask(cidr);
            return {
                cidr: block.toString(),
                network: block.network,
                broadcast: block.broadcast,
                first: block.first,
                last: block.last,
                size: block.size,
                bitmask: block.bitmask,
                hostmask: block.hostmask,
                usableHosts: block.size - 2 // 减去网络地址和广播地址
            };
        } catch (e) {
            throw new Error(`获取IP段信息失败: ${e.message}`);
        }
    }
}

module.exports = IPUtils;

