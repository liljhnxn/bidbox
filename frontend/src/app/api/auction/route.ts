import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { botchainMainnet } from '@/config/network';
import { BIDBOX_ABI, BIDBOX_CONTRACT_ADDRESS } from '@/config/contract';

const serverClient = createPublicClient({
  chain: botchainMainnet,
  transport: http('https://rpc.botchain.ai'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetAddress = (searchParams.get('address') || BIDBOX_CONTRACT_ADDRESS) as `0x${string}`;

  if (!targetAddress || !targetAddress.startsWith('0x') || targetAddress.length !== 42) {
    return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 });
  }

  try {
    const details = await serverClient.readContract({
      address: targetAddress,
      abi: BIDBOX_ABI,
      functionName: 'getAuctionDetails',
    });

    const [
      itemName,
      creator,
      auctionEndTime,
      highestBidder,
      highestBid,
      totalBids,
      ended,
      cancelled,
      timeLeft,
    ] = details;

    const userWallet = searchParams.get('user');
    let userRefund = '0';

    if (userWallet && userWallet.startsWith('0x') && userWallet.length === 42) {
      try {
        const ref = await serverClient.readContract({
          address: targetAddress,
          abi: BIDBOX_ABI,
          functionName: 'refunds',
          args: [userWallet as `0x${string}`],
        });
        userRefund = (ref as bigint).toString();
      } catch (e) {
        // Ignored
      }
    }

    return NextResponse.json({
      itemName,
      creator,
      auctionEndTime: auctionEndTime.toString(),
      highestBidder,
      highestBid: highestBid.toString(),
      totalBids: totalBids.toString(),
      ended,
      cancelled,
      timeLeft: timeLeft.toString(),
      userRefund,
    });
  } catch (error: any) {
    console.error('Server auction read error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch auction' }, { status: 500 });
  }
}
