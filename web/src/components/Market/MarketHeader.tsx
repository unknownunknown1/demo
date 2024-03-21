import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { useResolveMarket } from "@/hooks/useResolveMarket";
import { SupportedChain } from "@/lib/chains";
import {
  CalendarIcon,
  CategoricalIcon,
  CheckCircleIcon,
  DaiLogo,
  EyeIcon,
  HourGlassIcon,
  MultiScalarIcon,
  RightArrow,
  ScalarIcon,
} from "@/lib/icons";
import { MarketTypes, getMarketType, getOpeningTime } from "@/lib/market";
import { paths } from "@/lib/paths";
import { getAnswerText, getRealityLink, isFinalized } from "@/lib/reality";
import { displayBalance, getTimeLeft } from "@/lib/utils";
import clsx from "clsx";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useModal } from "../Modal";
import { AnswerForm } from "./AnswerForm";

interface MarketHeaderProps {
  market: Market;
  chainId: SupportedChain;
  isPreview?: boolean;
}

export const STATUS_TEXTS: Record<MarketStatus, string> = {
  [MarketStatus.NOT_OPEN]: "Market not open yet",
  [MarketStatus.OPEN]: "Market open",
  [MarketStatus.ANSWER_NOT_FINAL]: "Waiting for answer",
  [MarketStatus.PENDING_EXECUTION]: "Pending execution",
  [MarketStatus.CLOSED]: "Closed",
};

export const MARKET_TYPES_TEXTS: Record<MarketTypes, string> = {
  [MarketTypes.CATEGORICAL]: "Categorical",
  [MarketTypes.SCALAR]: "Scalar",
  [MarketTypes.MULTI_SCALAR]: "Multi Scalar",
};

export const MARKET_TYPES_ICONS: Record<MarketTypes, React.ReactNode> = {
  [MarketTypes.CATEGORICAL]: <CategoricalIcon />,
  [MarketTypes.SCALAR]: <ScalarIcon />,
  [MarketTypes.MULTI_SCALAR]: <MultiScalarIcon />,
};

type ColorConfig = { border: string; bg: string; text: string; dot: string };
export const COLORS: Record<MarketStatus, ColorConfig> = {
  [MarketStatus.NOT_OPEN]: {
    border: "border-t-black-secondary",
    bg: "bg-black-light",
    text: "text-black-secondary",
    dot: "bg-black-secondary",
  },
  [MarketStatus.OPEN]: {
    border: "border-t-purple-primary",
    bg: "bg-purple-medium",
    text: "text-purple-primary",
    dot: "bg-purple-primary",
  },
  [MarketStatus.ANSWER_NOT_FINAL]: {
    border: "border-t-warning-primary",
    bg: "bg-warning-light",
    text: "text-warning-primary",
    dot: "bg-warning-primary",
  },
  [MarketStatus.PENDING_EXECUTION]: {
    border: "border-t-tint-blue-primary",
    bg: "bg-tint-blue-light",
    text: "text-tint-blue-primary",
    dot: "bg-tint-blue-primary",
  },
  [MarketStatus.CLOSED]: {
    border: "border-t-success-primary",
    bg: "bg-success-light",
    text: "text-success-primary",
    dot: "bg-success-primary",
  },
};

interface MarketInfoProps {
  market: Market;
  marketStatus: MarketStatus;
  isPreview: boolean;
  chainId: SupportedChain;
  openAnswerModal: (question: Question) => void;
}

function MarketInfo({ market, marketStatus, isPreview, chainId, openAnswerModal }: MarketInfoProps) {
  const resolveMarket = useResolveMarket();

  const resolveHandler = async () => {
    resolveMarket.mutateAsync({
      marketId: market.id,
    });
  };

  if (marketStatus === MarketStatus.NOT_OPEN) {
    return (
      <div className="flex items-center space-x-2">
        <CalendarIcon /> <div>Opening at {getOpeningTime(market)}</div>
      </div>
    );
  }

  if (marketStatus === MarketStatus.OPEN) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <button type="button" className="text-purple-primary" onClick={() => openAnswerModal(market.questions[0])}>
            Answer on Reality.eth!
          </button>
          <RightArrow />
        </div>
      </>
    );
  }

  if (marketStatus === MarketStatus.ANSWER_NOT_FINAL) {
    const marketType = getMarketType(market);

    return (
      <div className="space-y-[16px]">
        {market.questions.map((question, i) => {
          const marketFinalized = isFinalized(question);
          return (
            <div
              className={clsx(
                "flex items-center space-x-[12px]",
                marketFinalized && "text-success-primary",
                isPreview && "flex-wrap",
              )}
              key={question.id}
            >
              <div className="flex items-center space-x-2">
                {marketFinalized ? <CheckCircleIcon className="text-success-primary" /> : <HourGlassIcon />}
                {marketType === MarketTypes.MULTI_SCALAR && (
                  <>
                    <div>{market.outcomes[i]}</div>
                    <div className="text-black-medium">|</div>
                  </>
                )}
                {question.finalize_ts > 0 && (
                  <div>Answer: {getAnswerText(question, market.outcomes, market.templateId)}</div>
                )}
              </div>
              {!marketFinalized && question.finalize_ts === 0 && (
                <button type="button" className="text-purple-primary" onClick={() => openAnswerModal(question)}>
                  Answer on Reality.eth
                </button>
              )}
              {!marketFinalized && question.finalize_ts > 0 && (
                <>
                  {!isPreview && <div className="text-black-medium">|</div>}
                  <div className={clsx("text-black-secondary grow", isPreview && "w-full mt-[5px]")}>
                    <span>
                      If this is not correct, you can correct it within {getTimeLeft(question.finalize_ts)} on
                    </span>{" "}
                    <button
                      type="button"
                      className="text-purple-primary inline-flex items-center space-x-2"
                      onClick={() => openAnswerModal(question)}
                    >
                      <span>Reality.eth</span>
                      <RightArrow />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  //marketStatus === MarketStatus.PENDING_EXECUTION || marketStatus === MarketStatus.CLOSED
  return (
    <div className="flex items-center space-x-[12px]">
      <div className="flex items-center space-x-2">
        {marketStatus === MarketStatus.PENDING_EXECUTION && <HourGlassIcon />}
        {marketStatus === MarketStatus.CLOSED && <CheckCircleIcon />}
        <div>Answer: {getAnswerText(market.questions[0], market.outcomes, market.templateId)}</div>
      </div>
      <div className="text-black-medium">|</div>
      <div className="flex items-center space-x-2">
        {marketStatus === MarketStatus.PENDING_EXECUTION && (
          <div className="text-purple-primary" onClick={resolveHandler}>
            Report Answer
          </div>
        )}
        {marketStatus === MarketStatus.CLOSED && (
          <a
            className="text-purple-primary"
            href={getRealityLink(chainId, market.questionId)}
            target="_blank"
            rel="noreferrer"
          >
            Check it on Reality.eth
          </a>
        )}
        <RightArrow />
      </div>
    </div>
  );
}

export function OutcomesInfo({ market, outcomesCount = 0 }: { market: Market; outcomesCount?: number }) {
  const outcomes = outcomesCount > 0 ? market.outcomes.slice(0, outcomesCount) : market.outcomes;

  return (
    <div>
      <div className="space-y-3">
        {outcomes.map((outcome, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey:
          <div key={`${outcome}_${i}`} className={clsx("flex justify-between px-[24px] py-[8px]")}>
            <div className="flex space-x-[12px]">
              <div className="w-[65px]">
                <div className="w-[48px] h-[48px] rounded-full bg-purple-primary mx-auto"></div>
              </div>
              <div className="space-y-1">
                <div>
                  <span className="text-[16px]">
                    #{i + 1} {outcome}
                  </span>
                </div>
                <div className="text-[12px] text-[#999999]">xM DAI</div>
              </div>
            </div>
            <div className="flex space-x-10 items-center">
              <div className="text-[24px] font-semibold">50%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoWithModal({
  market,
  marketStatus,
  colors,
  isPreview,
  chainId,
}: { market: Market; marketStatus?: MarketStatus; colors?: ColorConfig; isPreview: boolean; chainId: SupportedChain }) {
  const { Modal, openModal, closeModal } = useModal("answer-modal");
  const [modalQuestion, setModalQuestion] = useState<Question | undefined>();

  const openAnswerModal = (question: Question) => {
    setModalQuestion(question);
    openModal();
  };

  if (!market || !marketStatus) {
    return null;
  }

  return (
    <div className={clsx("text-[14px]", colors?.text)}>
      <MarketInfo
        market={market}
        marketStatus={marketStatus}
        isPreview={isPreview}
        chainId={chainId}
        openAnswerModal={openAnswerModal}
      />
      {modalQuestion && (
        <Modal
          title="Report Answer"
          content={
            <AnswerForm
              market={market}
              marketStatus={marketStatus}
              question={modalQuestion}
              closeModal={closeModal}
              chainId={chainId}
            />
          }
        />
      )}
    </div>
  );
}

export function MarketHeader({ market, chainId, isPreview = false }: MarketHeaderProps) {
  const { data: marketStatus } = useMarketStatus(market, chainId);
  const [showMarketInfo, setShowMarketInfo] = useState(!isPreview);

  const colors = marketStatus && COLORS[marketStatus];

  return (
    <div className="bg-white rounded-[3px] drop-shadow text-left flex flex-col">
      <div
        className={clsx(
          "flex justify-between border-t border-t-[5px] text-[14px] px-[25px] h-[45px] items-center",
          colors?.border,
          colors?.bg,
          colors?.text,
        )}
      >
        <div className="flex items-center space-x-2">
          <div className={clsx("w-[8px] h-[8px] rounded-full", colors?.dot)}></div>
          {marketStatus && <div>{STATUS_TEXTS[marketStatus]}</div>}
        </div>
        <div>{market.index && `#${market.index}`}</div>
      </div>

      <div className={clsx("flex space-x-3 p-[24px]", market.questions.length > 1 && "pb-[16px]")}>
        <div>
          <div className="w-[65px] h-[65px] rounded-full bg-purple-primary"></div>
        </div>
        <div className="grow">
          <div className={clsx("font-semibold mb-1 text-[16px]", !isPreview && "lg:text-[24px]")}>
            {!isPreview && market.marketName}
            {isPreview && <Link to={paths.market(market.id, chainId)}>{market.marketName}</Link>}
          </div>
          {market.questions.length === 1 && (
            <InfoWithModal
              market={market}
              marketStatus={marketStatus}
              colors={colors}
              isPreview={isPreview}
              chainId={chainId}
            />
          )}
          {market.questions.length > 1 && (
            <div className="flex space-x-2 items-center text-[14px]">
              <EyeIcon />{" "}
              <span className="text-purple-primary cursor-pointer" onClick={() => setShowMarketInfo(!showMarketInfo)}>
                {showMarketInfo ? "Hide questions" : "Show questions"}
              </span>
            </div>
          )}
        </div>
      </div>

      {market.questions.length > 1 && showMarketInfo && (
        <div className="px-[24px] pb-[16px]">
          <InfoWithModal
            market={market}
            marketStatus={marketStatus}
            colors={colors}
            isPreview={isPreview}
            chainId={chainId}
          />
        </div>
      )}

      {isPreview && (
        <div className="border-t border-[#E5E5E5] py-[16px]">
          <OutcomesInfo market={market} outcomesCount={3} />
        </div>
      )}

      <div className="border-t border-[#E5E5E5] px-[25px] h-[45px] flex items-center justify-between text-[14px] mt-auto">
        <div className="flex items-center space-x-[10px] lg:space-x-6">
          <div className="flex items-center space-x-2">
            {MARKET_TYPES_ICONS[getMarketType(market)]} <div>{MARKET_TYPES_TEXTS[getMarketType(market)]}</div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[#999999]">Open interest:</span>{" "}
            <div>{displayBalance(market.outcomesSupply, 18, true)} sDAI</div> <DaiLogo />
          </div>
        </div>
        <div className="text-[#00C42B] flex items-center space-x-2">
          <CheckCircleIcon />
          <div className="max-lg:hidden">Verified</div>
        </div>
      </div>
    </div>
  );
}
