import { Trash } from "@phosphor-icons/react";
import { TOPICS } from "../../lib/practice";
import type { TopicStats } from "../../lib/practice";
import { TOPIC_MAP } from "../../lib/practice/topics";
import type { TopicId } from "../../lib/practice/types";
import { ProgressBar } from "./ui";

interface TopicsProgressProps {
  topicStats: Record<TopicId, TopicStats>;
  solved: number;
  total: number;
  weakTopics: TopicId[];
  onSelectTopic: (topic: TopicId) => void;
  onResetAll: () => void;
}

export function TopicsProgress({
  topicStats,
  solved,
  total,
  weakTopics,
  onSelectTopic,
  onResetAll,
}: TopicsProgressProps) {
  return (
    <section className="panel mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border p-4 sm:px-5">
        <h2 className="font-mono text-lg font-extrabold uppercase tracking-tight text-text">
          Прогресс по темам
        </h2>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
          Решено {solved} из {total}
        </span>
      </div>

      <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {TOPICS.map((topic) => {
          const item = topicStats[topic.id];

          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelectTopic(topic.id)}
              className="border-2 border-border bg-canvas p-3 text-left transition-colors hover:bg-surface-alt"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-text">
                  {topic.label}
                </span>
                <span className="shrink-0 font-mono text-[10px] font-bold text-text-tertiary">
                  {item.solved}/{item.total}
                </span>
              </span>
              <ProgressBar
                value={item.solved}
                total={item.total}
                className="mt-2"
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t-2 border-border p-4 sm:px-5">
        {weakTopics.length > 0 ? (
          <>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Слабые темы:
            </span>
            {weakTopics.map((topicId) => (
              <button
                key={topicId}
                type="button"
                onClick={() => onSelectTopic(topicId)}
                className="border-2 border-border bg-pale-red-bg px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-pale-red-text transition-colors hover:bg-pale-red-bg-hover"
              >
                {TOPIC_MAP[topicId].label}
              </button>
            ))}
          </>
        ) : (
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            Прогресс хранится в localStorage
          </span>
        )}

        <button
          type="button"
          onClick={onResetAll}
          className="ml-auto inline-flex items-center gap-1.5 border-2 border-border bg-surface px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-pale-red-bg hover:text-pale-red-text"
        >
          <Trash size={12} weight="bold" />
          Сбросить прогресс
        </button>
      </div>
    </section>
  );
}
