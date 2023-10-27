package benchmark

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/clickvisual/clickvisual/api/internal/pkg/agent/search"
)

/*
standard unit test for agent search pkg
*/

func TestLogsStandard(t *testing.T) {
	caseLen := len(casesFiles)
	a := assert.New(t)
	for i := 0; i < caseLen; i++ {
		file := casesFiles[i]
		categoriesLen := len(file.logCategories)
		for j := 0; j < categoriesLen; j++ {
			log := file.logCategories[j]
			req := search.Request{
				StartTime: file.st,
				EndTime:   file.et,
				Path:      file.path,
				Limit:     500,
				KeyWord:   log.filter,
				Interval:  search.ChartsIntervalConvert(file.et - file.st),
			}
			resp, err := search.Run(req)
			a.NoError(err, "logs search error -> ", file.path, log.content, log.count)
			a.Equal(min(log.count, 500), int64(len(resp.Data)), "logs count error")
		}
	}
}

func TestChartsStandard(t *testing.T) {
	caseLen := len(casesFiles)
	a := assert.New(t)
	for i := 0; i < caseLen; i++ {
		file := casesFiles[i]
		categoriesLen := len(file.logCategories)
		for j := 0; j < categoriesLen; j++ {
			log := file.logCategories[i]
			req := search.Request{
				IsChartRequest: true,
				StartTime:      file.st,
				EndTime:        file.et,
				Path:           file.path,
				KeyWord:        log.filter,
				Interval:       search.ChartsIntervalConvert(file.et - file.st),
			}
			resp, err := search.RunCharts(req)
			a.NoError(err, "charts search error -> ", file.path, log.filter, log.count)
			total := int64(0)
			for _, v := range resp.Data {
				total += v
			}
			a.Equal(log.count, total, "charts count error", file.path, log.filter, log.count)
		}
	}
}

func TestSingleCase(t *testing.T) {
	a := assert.New(t)
	file := casesFiles[1]
	log := file.logCategories[1]
	req := search.Request{
		IsChartRequest: true,
		StartTime:      file.st,
		EndTime:        file.et,
		Path:           file.path,
		KeyWord:        log.filter, // hit 60w logs
		Interval:       search.ChartsIntervalConvert(file.et - file.st),
	}
	resp, err := search.RunCharts(req)
	a.NoError(err, "charts search error -> ", file.path, log.filter, log.count)
	total := int64(0)
	for k, v := range resp.Data {
		total += v
		fmt.Printf("key: %d, value: %d\n", k, v)
	}
	fmt.Printf("expected :%d, actual: %d", log.count, total)
}
