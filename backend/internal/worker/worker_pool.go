package worker

import (
	"context"
	"sync"

	"github.com/username/event-ticketing-system/pkg/utils"
	"go.uber.org/zap"
)

type TaskType string

const (
	TaskReminder     TaskType = "REMINDER"
	TaskCancellation TaskType = "CANCELLATION"
	TaskUpdate       TaskType = "UPDATE"
)

type Task struct {
	Type     TaskType
	Payload  map[string]interface{}
	Callback func(Task) error
}

type WorkerPool struct {
	tasks      chan Task
	numWorkers int
	wg         sync.WaitGroup
}

func NewWorkerPool(numWorkers int, queueSize int) *WorkerPool {
	return &WorkerPool{
		tasks:      make(chan Task, queueSize),
		numWorkers: numWorkers,
	}
}

func (p *WorkerPool) Start(ctx context.Context) {
	for i := 0; i < p.numWorkers; i++ {
		p.wg.Add(1)
		go p.worker(ctx, i)
	}
	utils.Logger.Info("Worker pool started", zap.Int("workers", p.numWorkers))
}

func (p *WorkerPool) Submit(task Task) {
	p.tasks <- task
}

func (p *WorkerPool) worker(ctx context.Context, id int) {
	defer p.wg.Done()
	utils.Logger.Debug("Worker started", zap.Int("id", id))

	for {
		select {
		case <-ctx.Done():
			utils.Logger.Debug("Worker stopping", zap.Int("id", id))
			return
		case task, ok := <-p.tasks:
			if !ok {
				return
			}
			p.process(id, task)
		}
	}
}

func (p *WorkerPool) process(workerID int, task Task) {
	utils.Logger.Debug("Worker processing task", zap.Int("worker_id", workerID), zap.String("type", string(task.Type)))
	if err := task.Callback(task); err != nil {
		utils.Logger.Error("Task failed", zap.String("type", string(task.Type)), zap.Error(err))
	}
}

func (p *WorkerPool) Shutdown() {
	close(p.tasks)
	p.wg.Wait()
	utils.Logger.Info("Worker pool shut down successfully")
}
