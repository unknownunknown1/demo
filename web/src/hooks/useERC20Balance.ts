import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export async function fetchERC20Balance(token: Address, owner: Address) {
  return await readContract(config, {
    abi: erc20Abi,
    address: token,
    functionName: "balanceOf",
    args: [owner],
  });
}

export const useERC20Balance = (owner?: Address, token?: Address) => {
  return useQuery<bigint | undefined, Error>({
    enabled: !!owner && !!token,
    queryKey: ["useERC20Balance", owner, token],
    queryFn: async () => {
      return await fetchERC20Balance(token!, owner!);
    },
  });
};
