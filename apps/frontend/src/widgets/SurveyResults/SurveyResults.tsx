import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SurveyResultsDto } from '@forms-assistant/shared';
import styles from './SurveyResults.module.css';

export function SurveyResults({ results }: { results: SurveyResultsDto }) {
  return (
    <div>
      <p className={styles.total}>Всего ответов: {results.totalResponses}</p>
      {results.questions.map((question) => (
        <div key={question.questionId} className={styles.question}>
          <h3>{question.text}</h3>
          {question.options && (
            <>
              <div className={styles.options}>
                {question.options.map((option) => (
                  <div key={option.optionId} className={styles.optionHeader}>
                    <span>{option.text}</span>
                    <span>
                      {option.count} ({option.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.chartWrap}>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(120, question.options.length * 44)}
                >
                  <BarChart
                    data={question.options.map((option) => ({
                      name: option.text,
                      count: option.count,
                    }))}
                    layout="vertical"
                    margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value: string) =>
                        value.length > 18 ? `${value.slice(0, 18)}…` : value
                      }
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} name="Ответов" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          {question.textAnswers && (
            <ul className={styles.textAnswers}>
              {question.textAnswers.length === 0 && (
                <li className={styles.muted}>Пока нет ответов</li>
              )}
              {question.textAnswers.map((answer, index) => (
                <li key={`${question.questionId}-${index}`}>{answer}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
