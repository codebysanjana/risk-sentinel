import type { RiskGraphData, GraphNode, GraphEdge, Transaction } from '@/types';

export function generateRiskGraph(transactions: Transaction[]): RiskGraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();

  // Take top 8 most suspicious + 4 normal transactions
  const sorted = [...transactions].sort((a, b) => b.risk_score - a.risk_score);
  const suspicious = sorted.slice(0, 8);
  const normal = sorted.slice(-4);
  const selected = [...suspicious, ...normal];

  const centerX = 500;
  const centerY = 350;

  selected.forEach((txn, i) => {
    const angle = (i / selected.length) * Math.PI * 2;
    const radius = 220;
    const txnX = centerX + Math.cos(angle) * radius;
    const txnY = centerY + Math.sin(angle) * radius;
    const isSuspicious = txn.risk_score > 60;

    const txnNodeId = `txn-${txn.id}`;
    nodeMap.set(txnNodeId, {
      id: txnNodeId,
      label: txn.id,
      type: 'transaction',
      x: txnX,
      y: txnY,
      suspicious: isSuspicious,
      risk_score: txn.risk_score,
      details: {
        Amount: `${txn.currency}${txn.amount.toLocaleString()}`,
        Location: txn.location,
        'Risk Score': `${txn.risk_score}/100`,
        'Risk Level': txn.risk_level,
        'Threat Type': txn.threat_type,
      },
    });

    // User node
    const userNodeId = `user-${txn.user_id}`;
    if (!nodeMap.has(userNodeId)) {
      const userAngle = angle - 0.3;
      const userRadius = 340;
      nodeMap.set(userNodeId, {
        id: userNodeId,
        label: txn.user_id,
        type: 'user',
        x: centerX + Math.cos(userAngle) * userRadius,
        y: centerY + Math.sin(userAngle) * userRadius,
        suspicious: false,
        details: {
          'Account Age': `${txn.account_age_days} days`,
          'Trust Score': isSuspicious ? 'Low' : 'High',
        },
      });
    }
    edges.push({ source: userNodeId, target: txnNodeId, label: 'initiated', suspicious: isSuspicious });

    // Device node
    const deviceFp = txn.device_info || 'unknown';
    const deviceNodeId = `device-${deviceFp}`;
    if (!nodeMap.has(deviceNodeId)) {
      const devAngle = angle + 0.25;
      const devRadius = 280;
      nodeMap.set(deviceNodeId, {
        id: deviceNodeId,
        label: deviceFp.split(' / ')[0] || 'Device',
        type: 'device',
        x: centerX + Math.cos(devAngle) * devRadius,
        y: centerY + Math.sin(devAngle) * devRadius,
        suspicious: txn.is_new_device,
        details: {
          'Device Info': deviceFp,
          'New Device': txn.is_new_device ? 'Yes' : 'No',
        },
      });
    }
    edges.push({ source: deviceNodeId, target: txnNodeId, label: 'used', suspicious: txn.is_new_device });

    // IP node
    const ipNodeId = `ip-${txn.ip_address}`;
    if (!nodeMap.has(ipNodeId)) {
      const ipAngle = angle + 0.5;
      const ipRadius = 300;
      nodeMap.set(ipNodeId, {
        id: ipNodeId,
        label: txn.ip_address || 'Unknown IP',
        type: 'ip',
        x: centerX + Math.cos(ipAngle) * ipRadius,
        y: centerY + Math.sin(ipAngle) * ipRadius,
        suspicious: isSuspicious,
        details: {
          'IP Address': txn.ip_address || 'Unknown',
          'Reputation': isSuspicious ? 'Suspicious' : 'Clean',
        },
      });
    }
    edges.push({ source: ipNodeId, target: txnNodeId, label: 'origin', suspicious: isSuspicious });

    // Location node
    const locNodeId = `loc-${txn.location}`;
    if (!nodeMap.has(locNodeId)) {
      const locAngle = angle - 0.5;
      const locRadius = 310;
      nodeMap.set(locNodeId, {
        id: locNodeId,
        label: txn.location,
        type: 'location',
        x: centerX + Math.cos(locAngle) * locRadius,
        y: centerY + Math.sin(locAngle) * locRadius,
        suspicious: txn.is_new_location,
        details: {
          Location: txn.location,
          'New Location': txn.is_new_location ? 'Yes' : 'No',
        },
      });
    }
    edges.push({ source: locNodeId, target: txnNodeId, label: 'geo', suspicious: txn.is_new_location });

    // Merchant node
    const merchNodeId = `merchant-${txn.merchant}`;
    if (!nodeMap.has(merchNodeId)) {
      nodeMap.set(merchNodeId, {
        id: merchNodeId,
        label: txn.merchant || 'Unknown',
        type: 'merchant',
        x: centerX + Math.cos(angle + Math.PI) * 160,
        y: centerY + Math.sin(angle + Math.PI) * 160,
        suspicious: false,
        details: { Merchant: txn.merchant || 'Unknown' },
      });
    }
    edges.push({ source: txnNodeId, target: merchNodeId, label: 'paid to', suspicious: false });
  });

  // Center sentinel node
  nodes.push({
    id: 'sentinel',
    label: 'RISK SENTINEL',
    type: 'transaction',
    x: centerX,
    y: centerY,
    suspicious: false,
    details: { System: 'Risk Sentinel AI Engine', Status: 'Active' },
  });

  for (const node of nodeMap.values()) {
    nodes.push(node);
  }

  return { nodes, edges };
}

export function getNodeConnections(nodeId: string, graph: RiskGraphData) {
  return graph.edges.filter((e) => e.source === nodeId || e.target === nodeId);
}

export function getNodeTransactions(nodeId: string, graph: RiskGraphData, transactions: Transaction[]): Transaction[] {
  const connectedTxnIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.source === nodeId && edge.target.startsWith('txn-')) {
      connectedTxnIds.add(edge.target.replace('txn-', ''));
    }
    if (edge.target === nodeId && edge.source.startsWith('txn-')) {
      connectedTxnIds.add(edge.source.replace('txn-', ''));
    }
  }
  return transactions.filter((t) => connectedTxnIds.has(t.id));
}
