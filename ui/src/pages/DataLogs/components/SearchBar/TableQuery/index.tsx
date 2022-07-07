import { Button, Input } from "antd";
import searchBarStyles from "@/pages/DataLogs/components/SearchBar/index.less";
import IconFont from "@/components/IconFont";
import { useIntl } from "umi";
import { useModel } from "@@/plugin-model/useModel";
import { useEffect, useMemo, useState } from "react";
import { useDebounce, useDebounceFn } from "ahooks";
import { DEBOUNCE_WAIT } from "@/config/config";
import { PaneType } from "@/models/datalogs/types";
import { LogsResponse } from "@/services/dataLogs";
import { format } from "sql-formatter";
import { FormatPainterOutlined } from "@ant-design/icons";
import useLocalStorages, { LocalModuleType } from "@/hooks/useLocalStorages";

const { TextArea } = Input;

const TableQuery = () => {
  const i18n = useIntl();

  const {
    currentDatabase,
    statisticalChartsHelper,
    currentLogLibrary,
    logPanesHelper,
    onChangeCurrentLogPane,
  } = useModel("dataLogs");
  const { onSetLocalData } = useLocalStorages();
  const { logPanes } = logPanesHelper;
  const { chartSql, onChangeChartSql, doGetStatisticalTable } =
    statisticalChartsHelper;
  const [sql, setSql] = useState<string | undefined>(chartSql);

  const debouncedSql = useDebounce(sql, { wait: DEBOUNCE_WAIT });

  const dataLogsQuerySql: any = useMemo(() => {
    if (!currentLogLibrary?.id) return {};
    return onSetLocalData(undefined, LocalModuleType.datalogsQuerySql);
  }, [currentLogLibrary?.id]);

  const tid = (currentLogLibrary && currentLogLibrary.id.toString()) || "0";

  const oldPane = useMemo(() => {
    if (!currentLogLibrary?.id) return;
    return logPanes[currentLogLibrary?.id.toString()];
  }, [currentLogLibrary?.id, logPanes]);

  const doSearch = useDebounceFn(
    () => {
      if (!currentDatabase) return;
      doGetStatisticalTable
        .run(currentDatabase.iid, {
          query: sql ?? "",
        })
        .then((res) => {
          if (res?.code !== 0) return;
          onChangeCurrentLogPane({
            ...(oldPane as PaneType),
            logChart: res.data,
          });
        });
    },
    { wait: DEBOUNCE_WAIT }
  );

  const changeLocalStorage = (value: string) => {
    tid && (dataLogsQuerySql[tid] = value);
    onSetLocalData(dataLogsQuerySql, LocalModuleType.datalogsQuerySql);
  };

  useEffect(() => {
    onChangeChartSql(debouncedSql);
    onChangeCurrentLogPane({
      ...(oldPane as PaneType),
      logs: { ...(oldPane?.logs as LogsResponse), query: debouncedSql ?? "" },
      querySql: debouncedSql ?? "",
    });
  }, [debouncedSql]);

  useEffect(() => {
    dataLogsQuerySql[tid] && setSql(dataLogsQuerySql[tid]);
  }, [dataLogsQuerySql[tid]]);

  useEffect(() => {
    setSql(chartSql);
  }, [chartSql]);

  return (
    <>
      <TextArea
        allowClear
        value={sql}
        placeholder={`${i18n.formatMessage({
          id: "log.search.placeholder",
        })}`}
        onChange={(e) => {
          changeLocalStorage(e.target.value);
          setSql(e.target.value);
        }}
        autoSize={{ minRows: 10, maxRows: 10 }}
        onPressEnter={() => doSearch.run()}
      />
      <div
        className={searchBarStyles.formatButton}
        onClick={() => {
          if (sql) {
            setSql(format(sql as string));
            changeLocalStorage(format(sql as string));
          }
        }}
      >
        <FormatPainterOutlined />
      </div>
      <Button
        loading={doGetStatisticalTable.loading}
        className={searchBarStyles.searchBtn}
        type="primary"
        icon={<IconFont type={"icon-log-search"} />}
        onClick={() => {
          doSearch.run();
        }}
      >
        {i18n.formatMessage({ id: "search" })}
      </Button>
    </>
  );
};
export default TableQuery;
