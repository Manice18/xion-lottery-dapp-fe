"use client";

import { useEffect, useState } from "react";
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useModal,
} from "@burnt-labs/abstraxion";
import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import type { GranteeSignerClient } from "@burnt-labs/abstraxion-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CONTRACTS, TREASURY } from "@/lib/constants";
import { Trophy, Users, Coins, Wallet } from "lucide-react";

type ExecuteResultOrUndefined = ExecuteResult | string | undefined;

async function write(
  client: GranteeSignerClient | undefined,
  msg: unknown,
  sender: string,
  contract: string,
  funds?: { denom: string; amount: string }[]
) {
  if (!client) return;
  return client.execute(
    sender,
    contract,
    msg, // this is the function call from the contract that we wanna call
    {
      // this section is the fee config
      amount: [{ amount: "1", denom: "uxion" }],
      gas: "500000",
      granter: TREASURY.lottery_treasury,
    },
    "",
    funds
  );
}

async function read(
  client: GranteeSignerClient | undefined,
  msg: unknown,
  contract: string
) {
  if (!client) return;
  return client.queryContractSmart(contract, msg);
}

export default function LotteryDapp() {
  const {
    data: { bech32Address },
    isConnected,
  } = useAbstraxionAccount();

  const { client } = useAbstraxionSigningClient();
  const [, setShow] = useModal();
  const [executeResult, setExecuteResult] =
    useState<ExecuteResultOrUndefined>(undefined);
  const [lotteryAdmin, setLotteryAdmin] = useState<string | undefined>();
  const [depositAmount, setDepositAmount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [lotteryStarted, setLotteryStarted] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | undefined>();
  const [participants, setParticipants] = useState<string[]>([]);
  const [winningAmount, setWinningAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const execute = async (
    type: "read" | "write",
    msg: unknown,
    funds?: { denom: string; amount: string }[]
  ) => {
    setLoading(true);
    setExecuteResult(undefined);

    try {
      if (type === "write") {
        const res = await write(
          client,
          msg,
          bech32Address,
          CONTRACTS.lottery,
          funds
        );
        setExecuteResult(res);
      }

      if (type === "read") {
        const res = await read(client, msg, CONTRACTS.lottery);
        setExecuteResult(res);
      }
    } catch (err) {
      setExecuteResult("there was an error, check logs");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getLotteryOwner = async () => {
    const msg = { admin: {} };
    try {
      const res = await read(client, msg, CONTRACTS.lottery);
      setLotteryAdmin(res);
      if (res === bech32Address) {
        setIsAdmin(true);
      }
    } catch (err) {
      console.log(err);
      setLotteryAdmin(undefined);
    }
  };

  const isLotteryStarted = async () => {
    setLotteryStarted(false);
    const msg = { lottery_started: {} };
    try {
      const res = await read(client, msg, CONTRACTS.lottery);
      setLotteryStarted(res);
    } catch (err) {
      console.log(err);
      setLotteryStarted(false);
    }
  };

  const getParticipants = async () => {
    const msg = { total_participants: {} };
    const msg2 = { lottery_balance: {} };
    try {
      const res = await read(client, msg, CONTRACTS.lottery);
      const res2 = await read(client, msg2, CONTRACTS.lottery);
      setParticipants(res);
      setWinningAmount(res2);
    } catch (err) {
      console.log(err);
      setParticipants([]);
    }
  };

  const pickWinner = async () => {
    const msg = { pick_winner: {} };
    try {
      await write(client, msg, bech32Address, CONTRACTS.lottery);
      const res2 = await read(client, { winner: {} }, CONTRACTS.lottery);
      setWinner(res2);
    } catch (err) {
      console.log(err);
      setParticipants([]);
    }
  };

  const getPreviousWinner = async () => {
    const msg = { winner: {} };
    try {
      const res2 = await read(client, msg, CONTRACTS.lottery);
      setWinner(res2);
    } catch (err) {
      console.log(err);
      setParticipants([]);
    }
  };

  useEffect(() => {
    if (!client) return;
    getLotteryOwner();
    isLotteryStarted();
    getParticipants();
    getPreviousWinner();
  }, [client, executeResult]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Xion Lottery dApp
          </h1>
          <div>
            {isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-sm text-gray-400">Connected as:</p>
                  <p className="text-sm font-mono">{bech32Address}</p>
                </div>
                <Button onClick={() => setShow(true)} variant="destructive">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShow(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center text-white">
                <Trophy className="mr-2 text-yellow-500" />
                Lottery Status
              </CardTitle>
              <CardDescription>Current round information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-white">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-gray-400 text-sm">Status</p>
                    <p
                      className={`text-lg font-bold ${
                        lotteryStarted ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {lotteryStarted ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-gray-400 text-sm">Participants</p>
                    <p className="text-lg font-bold flex items-center justify-center">
                      <Users className="mr-2 h-4 w-4" />
                      {participants.length}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-gray-400 text-sm">Prize Pool</p>
                    <p className="text-lg font-bold flex items-center justify-center">
                      <Coins className="mr-2 h-4 w-4" />
                      {winningAmount} uxion
                    </p>
                  </div>
                </div>

                {lotteryAdmin === bech32Address && (
                  <div className="flex items-center space-x-2 p-4 bg-gray-700 rounded-lg">
                    <Switch
                      id="admin-mode"
                      checked={isAdmin}
                      onCheckedChange={setIsAdmin}
                    />
                    <Label htmlFor="admin-mode">Admin Mode</Label>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => execute("write", { start_lottery: {} })}
                      disabled={loading || lotteryStarted}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Processing..." : "Start New Lottery"}
                    </Button>
                    <Button
                      onClick={() => pickWinner}
                      disabled={
                        loading || !lotteryStarted || participants.length < 2
                      }
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? "Processing..." : "Pick Winner"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Coins className="mr-2 text-yellow-500" />
                Join the Lottery
              </CardTitle>
              <CardDescription>Try your luck!</CardDescription>
            </CardHeader>
            <CardContent>
              Previous Winner: {winner}
              {!lotteryStarted && (
                <div className="my-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                  <p>
                    Lottery is currently inactive. Please wait for the next
                    round to start.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deposit">Deposit Amount (UXION)</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      id="deposit"
                      type="number"
                      placeholder="Enter amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      disabled={loading || !lotteryStarted}
                      className="bg-gray-700 border-gray-600"
                    />
                    <Button
                      onClick={() =>
                        execute("write", { join_lottery: {} }, [
                          { denom: "uxion", amount: depositAmount },
                        ])
                      }
                      disabled={loading || !lotteryStarted}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {loading ? "Processing..." : "Enter Lottery"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Abstraxion onClose={() => setShow(false)} />
    </main>
  );
}
